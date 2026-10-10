import { randomUUID, createHash } from "node:crypto";
import type { Response } from "express";
import { config } from "./config.js";
import { caseScope, getCases, getCollection, type CaseDoc, type CaseDocument, type CaseMessage, type CaseVehicle, type SourceRef } from "./db.js";
import { DTC_PATTERN, vehicleKey } from "./catalog.js";
import { chunkText, extractSections, isSupported, MIN_CHUNK_CHARS, UnsupportedFileError } from "./documents.js";
import { embed } from "./embeddings.js";
import { retrieve } from "./retrieval.js";
import { describeCaseDocuments, extractDocumentFacts, streamChatReply, LlmError, LlmUnavailableError } from "./llm.js";
import { diagnose, toSource, type DiagnoseResponse } from "./diagnose.js";
import { DiagnoseRequest } from "./schemas.js";

export const LIMITS = { filesPerCase: 20, fileBytes: 25 * 1024 * 1024, messageChars: 4000, historyTurns: 20 };

const CASE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const isCaseId = (id: string) => CASE_ID.test(id);

export class CaseNotFoundError extends Error {
  constructor() {
    super("This case no longer exists. Start a new case.");
    this.name = "CaseNotFoundError";
  }
}

export class CaseInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaseInputError";
  }
}

/** Public view of a case (the stored report is returned separately). */
export function publicCase(c: CaseDoc) {
  const { _id, lastReport, ...rest } = c;
  return { id: _id, ...rest, hasReport: Boolean(lastReport) };
}

/** Remove the conversation (and the report built from it); uploaded documents stay. */
export async function clearMessages(id: string): Promise<CaseDoc> {
  await loadCase(id);
  await (await getCases()).updateOne({ _id: id }, { $set: { messages: [], updatedAt: new Date() }, $unset: { lastReport: "" } });
  return loadCase(id);
}

export async function createCase(vehicle: CaseVehicle = {}): Promise<CaseDoc> {
  const now = new Date();
  // A random v4 UUID is the only credential for a case; there are no user accounts.
  const doc: CaseDoc = { _id: randomUUID(), createdAt: now, updatedAt: now, vehicle, documents: [], messages: [] };
  await (await getCases()).insertOne(doc);
  return doc;
}

export async function loadCase(id: string): Promise<CaseDoc> {
  if (!isCaseId(id)) throw new CaseNotFoundError();
  const c = await (await getCases()).findOne({ _id: id });
  if (!c) throw new CaseNotFoundError();
  return c;
}

export async function updateVehicle(id: string, vehicle: CaseVehicle): Promise<CaseDoc> {
  await loadCase(id);
  const cases = await getCases();
  await cases.updateOne({ _id: id }, { $set: { vehicle, updatedAt: new Date() } });
  // Keep the vehicle tags on this case's chunks in step with the case.
  await (await getCollection()).updateMany(
    { scope: caseScope(id) },
    { $set: { "vehicle.make": vehicle.make, "vehicle.model": vehicle.model, "vehicle.makeKey": vehicleKey(vehicle.make), "vehicle.modelKey": vehicleKey(vehicle.model) } },
  );
  return loadCase(id);
}

/** Extract, chunk, embed and store one uploaded file, then pull out diagnostic facts. */
export async function addDocument(id: string, file: { originalname: string; size: number; buffer: Buffer }): Promise<CaseDocument> {
  const c = await loadCase(id);
  if (c.documents.length >= LIMITS.filesPerCase) throw new CaseInputError(`A case can hold up to ${LIMITS.filesPerCase} documents.`);
  // Browsers send filenames as latin1; recover UTF-8 names.
  const name = Buffer.from(file.originalname, "latin1").toString("utf8").slice(0, 200);
  if (!isSupported(name)) throw new UnsupportedFileError(name);

  const docId = createHash("sha1").update(`${id}:${name}:${Date.now()}:${Math.random()}`).digest("hex").slice(0, 16);
  const base: CaseDocument = {
    docId,
    name,
    size: file.size,
    status: "ready",
    chunks: 0,
    characters: 0,
    detectedDtcs: [],
    uploadedAt: new Date(),
  };

  let sections;
  try {
    sections = await extractSections(new Uint8Array(file.buffer), name);
  } catch (err) {
    const failed: CaseDocument = {
      ...base,
      status: "failed",
      error: err instanceof UnsupportedFileError ? err.message : "The file could not be read. It may be corrupted, encrypted or scanned without text.",
    };
    await pushDocument(id, failed);
    return failed;
  }

  const fullText = sections.map((s) => s.text).join("\n\n");
  const pending = sections.flatMap((s) =>
    chunkText(s.text)
      .filter((t) => t.length >= MIN_CHUNK_CHARS)
      .map((text) => ({ text, page: s.page, section: s.section })),
  );
  if (pending.length === 0) {
    const failed: CaseDocument = {
      ...base,
      status: "failed",
      error: "No readable text was found. Scanned PDFs need OCR before upload.",
      pages: sections.some((s) => s.page) ? sections.length : undefined,
    };
    await pushDocument(id, failed);
    return failed;
  }

  const vectors = await embed(pending.map((p) => `${name}${p.section ? ` — ${p.section}` : ""}\n${p.text}`), "document");
  const v = c.vehicle;
  await (await getCollection()).insertMany(
    pending.map((p, i) => ({
      _id: `${docId}:${i}`,
      scope: caseScope(id),
      docId,
      sourceTitle: name,
      docType: "uploaded_document" as const,
      vehicle: { make: v.make, model: v.model, years: v.year ? [v.year] : undefined, makeKey: vehicleKey(v.make), modelKey: vehicleKey(v.model), yearsAll: !v.year },
      components: [],
      dtcs: [...new Set(p.text.toUpperCase().match(DTC_PATTERN) ?? [])],
      language: "und",
      page: p.page,
      section: p.section,
      chunkIndex: i,
      text: p.text,
      embedding: vectors[i],
      embeddingModel: config.embeddings.model,
      ingestedAt: new Date(),
    })),
  );

  const doc: CaseDocument = {
    ...base,
    pages: sections.some((s) => s.page) ? sections.length : undefined,
    chunks: pending.length,
    characters: fullText.length,
    detectedDtcs: [...new Set(fullText.toUpperCase().match(DTC_PATTERN) ?? [])].slice(0, 50),
  };
  try {
    doc.extraction = await extractDocumentFacts(name, fullText);
    // Tag chunks with the components the document is about, for component lookups.
    if (doc.extraction.components.length)
      await (await getCollection()).updateMany({ docId }, { $set: { components: doc.extraction.components } });
  } catch (err) {
    console.error("[extract]", (err as Error).message);
    doc.extractionError = "Automatic fact extraction failed; the document is still searchable.";
  }
  await pushDocument(id, doc);
  return doc;
}

async function pushDocument(id: string, doc: CaseDocument) {
  await (await getCases()).updateOne({ _id: id }, { $push: { documents: doc }, $set: { updatedAt: new Date() } });
}

export async function removeDocument(id: string, docId: string): Promise<CaseDoc> {
  await loadCase(id);
  await (await getCollection()).deleteMany({ scope: caseScope(id), docId });
  await (await getCases()).updateOne({ _id: id }, { $pull: { documents: { docId } }, $set: { updatedAt: new Date() } });
  return loadCase(id);
}

export async function deleteCase(id: string): Promise<void> {
  await loadCase(id);
  await (await getCollection()).deleteMany({ scope: caseScope(id) });
  await (await getCases()).deleteOne({ _id: id });
}

/** Replace this-turn citation ids with readable source names for use in later turns. */
function rewriteCitations(m: CaseMessage): string {
  if (m.role !== "assistant" || !m.sources?.length) return m.content;
  const byId = new Map(m.sources.map((s) => [s.id, s]));
  return m.content.replace(/\[(S\d+)\]/g, (whole, sid: string) => {
    const s = byId.get(sid);
    return s ? `[${s.sourceTitle}${s.page != null ? `, p. ${s.page}` : ""}]` : whole;
  });
}

function sseWrite(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Answer a chat message over Server-Sent Events: `sources`, `delta`*, then `done` or `error`. */
const NO_SOURCES_TEXT =
  "I couldn't find anything about this in your documents or the knowledge base, so I can't answer it with sources. I can give a general answer from general engineering knowledge instead. It won't be cited, so treat it as unverified.";
const GENERAL_PREFIX = "General answer, not from your documents or the knowledge base (unverified):\n\n";

export async function chat(id: string, message: string, language: string, res: Response, general = false) {
  const c = await loadCase(id);
  const text = message.trim();
  if (!text) throw new CaseInputError("Write a message first.");
  if (text.length > LIMITS.messageChars) throw new CaseInputError(`Keep messages under ${LIMITS.messageChars} characters.`);

  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" });
  let aborted = false;
  res.on("close", () => (aborted = true));

  try {
    // Recent user turns give the retrieval query context ("what about the coolant pump?").
    const recentUser = c.messages.filter((m) => m.role === "user").slice(-2).map((m) => m.content);
    const codes = [...new Set([...text.toUpperCase().match(DTC_PATTERN) ?? []])];
    const { evidence, vehicleMatch } = await retrieve({
      query: [...recentUser, text].join("\n"),
      make: c.vehicle.make,
      model: c.vehicle.model,
      year: c.vehicle.year,
      caseId: id,
      dtcs: codes,
    });
    const sources: SourceRef[] = evidence.map(toSource);
    sseWrite(res, "sources", { sources, vehicleMatch });

    // Nothing to cite: say so instead of answering from the model's memory. The user can ask
    // for a general answer, which is labelled as uncited.
    const useGeneral = evidence.length === 0 && general;
    if (evidence.length === 0 && !general) {
      const userMsg: CaseMessage = { id: randomUUID(), role: "user", content: text, createdAt: new Date() };
      const assistantMsg: CaseMessage = { id: randomUUID(), role: "assistant", content: NO_SOURCES_TEXT, mode: "no_sources", createdAt: new Date() };
      sseWrite(res, "delta", { text: NO_SOURCES_TEXT });
      await (await getCases()).updateOne({ _id: id }, { $push: { messages: { $each: [userMsg, assistantMsg] } }, $set: { updatedAt: new Date() } });
      sseWrite(res, "done", { user: userMsg, assistant: assistantMsg });
      return;
    }
    if (useGeneral) sseWrite(res, "delta", { text: GENERAL_PREFIX });

    const history = c.messages.slice(-LIMITS.historyTurns * 2).map((m) => ({ role: m.role, content: rewriteCitations(m) }));
    const rawReply = await streamChatReply({
      history,
      caseDoc: c,
      message: text,
      evidence,
      match: vehicleMatch,
      language,
      general: useGeneral,
      onText: (delta) => !aborted && sseWrite(res, "delta", { text: delta }),
    });

    // Citations must point at excerpts that were retrieved. Strip any that do not, and say so
    // when a sourced answer ends up with no valid citation at all.
    const valid = new Set(evidence.map((e) => e.id));
    // Models sometimes group citations ("[S2, S3]"); split them so each one is checked and linked.
    const split = rawReply.replace(/\[(S\d+(?:\s*,\s*S\d+)+)\]/g, (_m, ids: string) => ids.split(/\s*,\s*/).map((id) => `[${id}]`).join(" "));
    let reply = useGeneral ? GENERAL_PREFIX + rawReply : split.replace(/\s?\[(S\d+)\]/g, (m, sid) => (valid.has(sid) ? m : ""));
    if (!useGeneral && ![...reply.matchAll(/\[(S\d+)\]/g)].length) {
      const note = "\n\nNote: this reply does not cite a source, so treat it as unverified.";
      reply += note;
      if (!aborted) sseWrite(res, "delta", { text: note });
    }

    const cited = new Set([...reply.matchAll(/\[(S\d+)\]/g)].map((m) => m[1]));
    const now = new Date();
    const userMsg: CaseMessage = { id: randomUUID(), role: "user", content: text, createdAt: now };
    const assistantMsg: CaseMessage = {
      id: randomUUID(),
      role: "assistant",
      content: reply,
      ...(useGeneral && { mode: "general" as const }),
      // Keep cited sources first; drop uncited ones to keep the case document small.
      sources: sources.filter((s) => cited.has(s.id)),
      createdAt: new Date(),
    };
    // Store the pair only once the reply completed, so history always alternates.
    // A general answer replaces the "no sources" exchange it follows instead of repeating the question.
    const replaces = useGeneral && c.messages.at(-1)?.mode === "no_sources" && c.messages.at(-2)?.content === text;
    await (await getCases()).updateOne(
      { _id: id },
      replaces
        ? { $set: { messages: [...c.messages.slice(0, -2), userMsg, assistantMsg], updatedAt: new Date() } }
        : { $push: { messages: { $each: [userMsg, assistantMsg] } }, $set: { updatedAt: new Date() } },
    );
    sseWrite(res, "done", { user: userMsg, assistant: assistantMsg, replaced: replaces });
  } catch (err) {
    console.error("[chat]", err);
    const message =
      err instanceof LlmError || err instanceof LlmUnavailableError ? err.message : "The reply could not be completed. Check the diagnostic service logs and try again.";
    sseWrite(res, "error", { message });
  } finally {
    res.end();
  }
}

/** Build the structured investigation report from the case conversation and documents. */
export async function caseReport(id: string, language: string): Promise<DiagnoseResponse> {
  const c = await loadCase(id);
  const userText = c.messages.filter((m) => m.role === "user").map((m) => m.content);
  const ready = c.documents.filter((d) => d.status === "ready");
  if (userText.length === 0 && ready.length === 0)
    throw new CaseInputError("Describe the fault in the chat or upload a document before generating a report.");

  const codes = new Set<string>();
  for (const d of ready) {
    d.detectedDtcs.forEach((x) => codes.add(x));
    d.extraction?.dtcs.forEach((x) => codes.add(x.code.toUpperCase()));
  }
  userText.forEach((t) => (t.toUpperCase().match(DTC_PATTERN) ?? []).forEach((x) => codes.add(x)));

  const measurements = ready
    .flatMap((d) => d.extraction?.measurements ?? [])
    .slice(0, 30)
    .map((m) => ({ name: m.name.slice(0, 80), value: m.value.slice(0, 40), ...(m.unit && { unit: m.unit.slice(0, 16) }) }));

  const symptoms = (
    userText.length ? userText.join("\n\n") : `No description given in chat. Uploaded documents:\n${describeCaseDocuments(c)}`
  ).slice(-4000);

  const input = DiagnoseRequest.parse({
    vehicle: c.vehicle,
    symptoms: symptoms.length >= 12 ? symptoms : `${symptoms} (see uploaded documents)`,
    dtcs: [...codes].filter((x) => /^[PBCU][0-9A-F]{4}$/.test(x)).slice(0, 20),
    measurements,
    language,
  });

  const transcript = c.messages
    .slice(-LIMITS.historyTurns * 2)
    .map((m) => `${m.role === "user" ? "Technician" : "FixSkrew"}: ${rewriteCitations(m)}`)
    .join("\n\n");
  const caseContext = `Uploaded documents:\n${describeCaseDocuments(c)}\n\nConversation so far:\n${transcript || "(none)"}`;

  const result = await diagnose(input, { caseId: id, caseContext });
  await (await getCases()).updateOne({ _id: id }, { $set: { lastReport: result, updatedAt: new Date() } });
  return result;
}
