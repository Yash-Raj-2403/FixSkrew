/**
 * Ingest technical documents into MongoDB Atlas for FixSkrew retrieval.
 *
 *   npm run ingest -w backend                # ingest everything in knowledge/manifest.json
 *
 * Ingested documents form the shared knowledge base (scope "kb"); files that users upload
 * to a diagnosis case are stored separately with the case's scope.
 *   npm run ingest -w backend -- --dry-run   # parse + chunk only, no embeddings or writes
 *   npm run ingest -w backend -- --only manuals/hv-battery.pdf
 *
 * See knowledge/README.md for the manifest format.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod/v4";
import { chunkText, extractSections, MIN_CHUNK_CHARS, type Section } from "../src/documents.js";
import { COMPONENT_IDS, DOC_TYPES, DTC_PATTERN, vehicleKey, type ComponentId } from "../src/catalog.js";
import { config } from "../src/config.js";
import { getCollection, closeMongo, type ChunkDoc } from "../src/db.js";
import { embed } from "../src/embeddings.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.resolve(here, "../../knowledge");

const Manifest = z.object({
  documents: z.array(
    z.object({
      file: z.string(),
      title: z.string(),
      docType: z.enum(DOC_TYPES),
      publisher: z.string().optional(),
      publishedAt: z.string().optional(),
      sourceUri: z.string().optional(),
      language: z.string().default("en"),
      // Omit `vehicle` (or make/model) for general documentation that applies to all vehicles.
      vehicle: z
        .object({
          make: z.string().optional(),
          model: z.string().optional(),
          years: z.array(z.number().int()).optional(),
        })
        .default({}),
      components: z.array(z.enum(COMPONENT_IDS)).default([]),
      componentRules: z
        .array(z.object({ pattern: z.string(), components: z.array(z.enum(COMPONENT_IDS)) }))
        .default([]),
    }),
  ),
});
type ManifestDoc = z.infer<typeof Manifest>["documents"][number];

async function loadSections(doc: ManifestDoc): Promise<Section[]> {
  const abs = path.resolve(KNOWLEDGE_DIR, doc.file);
  if (!abs.startsWith(KNOWLEDGE_DIR)) throw new Error(`File escapes knowledge/: ${doc.file}`);
  return extractSections(new Uint8Array(await readFile(abs)), abs);
}

function tagComponents(text: string, doc: ManifestDoc): ComponentId[] {
  const tags = new Set<ComponentId>(doc.components);
  for (const rule of doc.componentRules) {
    if (new RegExp(rule.pattern, "i").test(text)) rule.components.forEach((c) => tags.add(c));
  }
  return [...tags];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : undefined;

  const manifestPath = path.join(KNOWLEDGE_DIR, "manifest.json");
  const manifest = Manifest.parse(JSON.parse(await readFile(manifestPath, "utf8")));
  // Optional, git-ignored manifest for licensed documents that must stay out of the repository.
  const localPath = path.join(KNOWLEDGE_DIR, "manifest.local.json");
  if (existsSync(localPath)) manifest.documents.push(...Manifest.parse(JSON.parse(await readFile(localPath, "utf8"))).documents);
  const docs = manifest.documents.filter((d) => !only || d.file === only);
  if (docs.length === 0) {
    console.log("No documents to ingest. Add entries to knowledge/manifest.json (see knowledge/README.md).");
    return;
  }

  const col = dryRun ? null : await getCollection();
  let total = 0;

  for (const doc of docs) {
    const docId = createHash("sha1").update(doc.file).digest("hex").slice(0, 16);
    const sections = await loadSections(doc);
    const pending: Omit<ChunkDoc, "embedding">[] = [];
    for (const s of sections) {
      for (const text of chunkText(s.text)) {
        if (text.length < MIN_CHUNK_CHARS) continue;
        pending.push({
          docId,
          sourceTitle: doc.title,
          sourceUri: doc.sourceUri,
          scope: "kb",
          docType: doc.docType,
          publisher: doc.publisher,
          publishedAt: doc.publishedAt,
          vehicle: {
            ...doc.vehicle,
            makeKey: vehicleKey(doc.vehicle.make),
            modelKey: vehicleKey(doc.vehicle.model),
            yearsAll: !doc.vehicle.years?.length,
          },
          components: tagComponents(text, doc),
          dtcs: [...new Set(text.toUpperCase().match(DTC_PATTERN) ?? [])],
          language: doc.language,
          page: s.page,
          section: s.section,
          chunkIndex: pending.length,
          text,
          embeddingModel: config.embeddings.model,
          ingestedAt: new Date(),
        });
      }
    }
    console.log(`${doc.file}: ${sections.length} sections -> ${pending.length} chunks`);
    total += pending.length;
    if (dryRun || !col || pending.length === 0) continue;

    // Prefix chunks with title/section so the embedding carries document context.
    const vectors = await embed(
      pending.map((c) => `${c.sourceTitle}${c.section ? ` — ${c.section}` : ""}\n${c.text}`),
      "document",
    );
    await col.deleteMany({ docId });
    await col.insertMany(pending.map((c, i) => ({ ...c, _id: `${docId}:${i}`, embedding: vectors[i] })));
    console.log(`  stored ${pending.length} chunks (docId ${docId})`);
  }
  console.log(`${dryRun ? "[dry run] " : ""}Done: ${total} chunks from ${docs.length} document(s).`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closeMongo());
