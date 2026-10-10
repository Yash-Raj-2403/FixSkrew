import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import cors from "cors";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { getCollection, mongoConfigured, ServiceNotConfiguredError, closeMongo } from "./db.js";
import { embeddingsConfigured } from "./embeddings.js";
import { CaseReportRequest, ChatRequest, DiagnoseRequest, VehicleSchema } from "./schemas.js";
import { diagnose } from "./diagnose.js";
import { sourcesForComponent } from "./retrieval.js";
import { ANY_VEHICLE, isComponentId } from "./catalog.js";
import { batteryFromCase } from "./battery.js";
import { analyseVisual, LlmError, LlmUnavailableError } from "./llm.js";
import { UnsupportedFileError } from "./documents.js";
import {
  addDocument,
  caseReport,
  CaseInputError,
  CaseNotFoundError,
  chat,
  clearMessages,
  createCase,
  deleteCase,
  LIMITS,
  loadCase,
  publicCase,
  removeDocument,
  updateVehicle,
} from "./cases.js";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: "64kb" }));

type ServiceState = "ready" | "not_configured" | "unreachable";

app.get("/api/health", async (_req, res) => {
  let database: ServiceState = mongoConfigured() ? "ready" : "not_configured";
  let chunks: number | null = null;
  let sources: number | null = null;
  let vehicles: { make?: string; model?: string }[] = [];
  if (database === "ready") {
    try {
      const col = await getCollection();
      // Knowledge-base stats only; files uploaded to cases are not part of the shared base.
      chunks = await col.countDocuments({ scope: "kb" });
      sources = chunks > 0 ? (await col.distinct("docId", { scope: "kb" })).length : 0;
      // Vehicles with dedicated documents, used for form suggestions.
      vehicles = await col
        .aggregate<{ make?: string; model?: string }>([
          { $match: { scope: "kb", "vehicle.modelKey": { $ne: ANY_VEHICLE } } },
          { $group: { _id: { make: "$vehicle.make", model: "$vehicle.model" } } },
          { $replaceWith: "$_id" },
          { $sort: { make: 1, model: 1 } },
          { $limit: 300 },
        ])
        .toArray();
    } catch (err) {
      console.error("[health] MongoDB unreachable:", (err as Error).message);
      database = "unreachable";
    }
  }
  const services = {
    database,
    embeddings: (embeddingsConfigured() ? "ready" : "not_configured") as ServiceState,
    llm: (config.llm.configured ? "ready" : "not_configured") as ServiceState,
  };
  // Ready to chat and upload; an empty shared knowledge base still allows working from uploads.
  const ready = Object.values(services).every((s) => s === "ready");
  res.json({
    ready,
    services,
    knowledgeBase: { chunks, sources, vehicles },
    models: {
      embedding: config.embeddings.model,
      embeddingProvider: config.embeddings.provider,
      llm: config.llm.model,
      llmProvider: config.llm.provider,
    },
    multilingual: config.embeddings.multilingual ? "embedding" : "translation",
  });
});

app.post("/api/diagnose", async (req, res, next) => {
  const parsed = DiagnoseRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: "validation_failed",
      message: "Some fields need attention.",
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  try {
    res.json(await diagnose(parsed.data));
  } catch (err) {
    next(err);
  }
});

app.get("/api/components/:id/sources", async (req, res, next) => {
  const { id } = req.params;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);
  const vehicle = { make: str(req.query.make), model: str(req.query.model) };
  if (!isComponentId(id)) {
    res.status(404).json({ error: "unknown_component", message: `Unknown component "${id}".` });
    return;
  }
  try {
    res.json({ component: id, vehicle, sources: await sourcesForComponent(id, vehicle) });
  } catch (err) {
    next(err);
  }
});

/* --------------------------------- cases ---------------------------------- */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITS.fileBytes, files: 10 },
});

const validationError = (res: Response, issues: { path: PropertyKey[]; message: string }[]) =>
  res.status(422).json({
    error: "validation_failed",
    message: "Some fields need attention.",
    issues: issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message })),
  });

app.post("/api/cases", async (req, res, next) => {
  const parsed = VehicleSchema.safeParse(req.body?.vehicle ?? {});
  if (!parsed.success) return void validationError(res, parsed.error.issues);
  try {
    res.status(201).json(publicCase(await createCase(parsed.data)));
  } catch (err) {
    next(err);
  }
});

app.get("/api/cases/:id", async (req, res, next) => {
  try {
    res.json(publicCase(await loadCase(req.params.id)));
  } catch (err) {
    next(err);
  }
});

app.delete("/api/cases/:id", async (req, res, next) => {
  try {
    await deleteCase(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

app.put("/api/cases/:id/vehicle", async (req, res, next) => {
  const parsed = VehicleSchema.safeParse(req.body ?? {});
  if (!parsed.success) return void validationError(res, parsed.error.issues);
  try {
    res.json(publicCase(await updateVehicle(req.params.id, parsed.data)));
  } catch (err) {
    next(err);
  }
});

app.post("/api/cases/:id/documents", upload.array("files", 10), async (req, res, next) => {
  const id = String(req.params.id);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) return void res.status(422).json({ error: "no_files", message: "Choose at least one file." });
  try {
    await loadCase(id);
    const results = [];
    for (const f of files) {
      try {
        results.push({ ok: true as const, document: await addDocument(id, f) });
      } catch (err) {
        if (err instanceof UnsupportedFileError || err instanceof CaseInputError)
          results.push({ ok: false as const, name: f.originalname, message: err.message });
        else throw err;
      }
    }
    res.json({ results, case: publicCase(await loadCase(id)) });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/cases/:id/documents/:docId", async (req, res, next) => {
  try {
    res.json(publicCase(await removeDocument(req.params.id, req.params.docId)));
  } catch (err) {
    next(err);
  }
});

app.post("/api/cases/:id/chat", async (req, res, next) => {
  const parsed = ChatRequest.safeParse(req.body);
  if (!parsed.success) return void validationError(res, parsed.error.issues);
  try {
    await chat(req.params.id, parsed.data.message, parsed.data.language, res, parsed.data.general);
  } catch (err) {
    next(err);
  }
});

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

app.delete("/api/cases/:id/messages", async (req, res, next) => {
  try {
    res.json(publicCase(await clearMessages(String(req.params.id))));
  } catch (err) {
    next(err);
  }
});

app.post("/api/cases/:id/visual", imageUpload.single("image"), async (req, res, next) => {
  try {
    const c = await loadCase(String(req.params.id));
    const f = req.file;
    if (!f) throw new CaseInputError("Choose an image or a video frame.");
    if (!IMAGE_TYPES.has(f.mimetype)) throw new CaseInputError("Use a JPEG, PNG or WebP image.");
    res.json(await analyseVisual({ image: { mimeType: f.mimetype, data: f.buffer }, caseDoc: c, language: String(req.body?.language ?? "auto") }));
  } catch (err) {
    next(err);
  }
});

app.get("/api/cases/:id/battery", async (req, res, next) => {
  try {
    res.json(batteryFromCase(await loadCase(String(req.params.id))));
  } catch (err) {
    next(err);
  }
});

app.post("/api/cases/:id/report", async (req, res, next) => {
  const parsed = CaseReportRequest.safeParse(req.body ?? {});
  if (!parsed.success) return void validationError(res, parsed.error.issues);
  try {
    res.json(await caseReport(req.params.id, parsed.data.language));
  } catch (err) {
    next(err);
  }
});

app.get("/api/cases/:id/report", async (req, res, next) => {
  try {
    const c = await loadCase(req.params.id);
    if (!c.lastReport) return void res.status(404).json({ error: "no_report", message: "No report has been generated for this case yet." });
    res.json(c.lastReport);
  } catch (err) {
    next(err);
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "not_found", message: "Unknown API route." });
});

// Serve the built frontend when it exists (single-process production deploy).
const here = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(here, "../../frontend/dist");
if (existsSync(webDist)) {
  app.use(express.static(webDist, { maxAge: "1h", index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(webDist, "index.html")));
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) {
    res.end();
    return;
  }
  if (err instanceof CaseNotFoundError) return void res.status(404).json({ error: "case_not_found", message: err.message });
  if (err instanceof CaseInputError) return void res.status(422).json({ error: "invalid_input", message: err.message });
  if (err instanceof UnsupportedFileError) return void res.status(415).json({ error: "unsupported_file", message: err.message });
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `Each file must be under ${LIMITS.fileBytes / 1024 / 1024} MB.`
        : err.code === "LIMIT_FILE_COUNT"
          ? "Upload up to 10 files at a time."
          : err.message;
    return void res.status(413).json({ error: "upload_rejected", message });
  }
  if (err instanceof ServiceNotConfiguredError) {
    res.status(503).json({ error: "service_not_configured", message: err.message, service: err.service });
    return;
  }
  if (err instanceof LlmError) {
    res.status(502).json({ error: "llm_failed", message: err.message });
    return;
  }
  if (err instanceof LlmUnavailableError) {
    res.status(err.rateLimited ? 429 : 502).json({ error: "llm_unavailable", message: err.message });
    return;
  }
  console.error("[error]", err);
  res.status(500).json({ error: "internal_error", message: "The diagnostic service hit an unexpected error." });
});

const server = app.listen(config.port, () => {
  console.log(`FixSkrew diagnostic service on http://localhost:${config.port}`);
  console.log(
    `Embeddings: ${config.embeddings.provider} (${config.embeddings.model}) · LLM: ${config.llm.provider} (${config.llm.model}, chat ${config.llm.fastModel})`,
  );
  const missing = [
    !mongoConfigured() && "MONGODB_URI",
    !embeddingsConfigured() && "GEMINI_API_KEY or VOYAGE_API_KEY",
    !config.llm.configured && "GEMINI_API_KEY or ANTHROPIC_API_KEY",
  ].filter(Boolean);
  if (missing.length) console.warn(`Not configured: ${missing.join(", ")} (see backend/.env.example)`);
});

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    server.close();
    void closeMongo().finally(() => process.exit(0));
  });
}
