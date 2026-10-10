/**
 * Create the Atlas Vector Search index used by FixSkrew retrieval.
 *   npm run create-index -w backend
 */
import { config } from "../src/config.js";
import { getCollection, getCases, closeMongo } from "../src/db.js";

async function main() {
  const col = await getCollection();
  // Search indexes need an existing collection; a fresh cluster has none.
  const db = col.db;
  const names = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
  if (!names.has(col.collectionName)) await db.createCollection(col.collectionName);
  const cases = await getCases();
  if (!names.has(cases.collectionName)) await db.createCollection(cases.collectionName);
  await cases.createIndex({ updatedAt: -1 });

  const definition = {
    fields: [
      { type: "vector", path: "embedding", numDimensions: config.embeddings.dimensions, similarity: "cosine" },
      { type: "filter", path: "scope" },
      { type: "filter", path: "vehicle.makeKey" },
      { type: "filter", path: "vehicle.modelKey" },
      { type: "filter", path: "vehicle.years" },
      { type: "filter", path: "vehicle.yearsAll" },
      { type: "filter", path: "docType" },
      { type: "filter", path: "components" },
      { type: "filter", path: "language" },
      { type: "filter", path: "dtcs" },
    ],
  };
  const existing = await col.listSearchIndexes(config.mongo.vectorIndex).toArray();
  if (existing.length) {
    // Keep an existing index in sync with the current filter fields and dimensions.
    await col.updateSearchIndex(config.mongo.vectorIndex, definition);
    console.log(`Updated vector index "${config.mongo.vectorIndex}". Atlas rebuilds it in the background.`);
  } else {
    await col.createSearchIndex({ name: config.mongo.vectorIndex, type: "vectorSearch", definition });
    console.log(`Created vector index "${config.mongo.vectorIndex}". Atlas builds it in the background (usually < 1 min).`);
  }
  // Regular index for exact DTC and component metadata lookups.
  await col.createIndex({ dtcs: 1 });
  await col.createIndex({ components: 1, "vehicle.modelKey": 1 });
  await col.createIndex({ scope: 1, docId: 1 });
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closeMongo());
