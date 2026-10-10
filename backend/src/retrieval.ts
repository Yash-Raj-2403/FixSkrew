import { config } from "./config.js";
import { caseScope, getCollection } from "./db.js";
import { embed } from "./embeddings.js";
import { ANY_VEHICLE, vehicleKey, type ComponentId } from "./catalog.js";

export interface Evidence {
  id: string; // short citation id, e.g. "S3"
  chunkId: string;
  docId: string;
  sourceTitle: string;
  sourceUri?: string;
  docType: string;
  publisher?: string;
  publishedAt?: string;
  page?: number;
  section?: string;
  components: string[];
  dtcs: string[];
  language: string;
  vehicle: { make?: string; model?: string; years?: number[] };
  text: string;
  /** Cosine similarity from Atlas Vector Search, or null for exact DTC metadata matches. */
  score: number | null;
  matchedBy: ("vector" | "dtc")[];
  /** Uploaded to this case by the user, or from the shared knowledge base. */
  origin: "case" | "knowledge_base";
}

/**
 * How closely retrieved evidence matches the technician's vehicle:
 * exact (make/model/year or general docs), year_relaxed (any year of that model),
 * any_vehicle (no vehicle-specific or general match; evidence may be from other vehicles),
 * unspecified (no vehicle given).
 */
export type VehicleMatch = "exact" | "year_relaxed" | "any_vehicle" | "unspecified";

export interface RetrievalResult {
  evidence: Evidence[];
  filters: Record<string, unknown>;
  vehicleMatch: VehicleMatch;
  candidatesConsidered: number;
}

interface VehicleQuery {
  make?: string;
  model?: string;
  year?: number;
}

interface RetrieveOptions extends VehicleQuery {
  query: string;
  /** Also search documents uploaded to this case. */
  caseId?: string;
  dtcs: string[];
  focusComponent?: ComponentId;
}

const projection = {
  _id: 1,
  docId: 1,
  sourceTitle: 1,
  sourceUri: 1,
  docType: 1,
  publisher: 1,
  publishedAt: 1,
  page: 1,
  section: 1,
  components: 1,
  dtcs: 1,
  language: 1,
  vehicle: 1,
  text: 1,
  scope: 1,
} as const;

const KB_SCOPE = { scope: { $eq: "kb" } };
const and = (...parts: (Record<string, unknown> | undefined)[]) => {
  const p = parts.filter((x): x is Record<string, unknown> => Boolean(x));
  return p.length === 0 ? undefined : p.length === 1 ? p[0] : { $and: p };
};

/** Metadata filter: documents for this vehicle, or general documents for all vehicles. */
export function vehicleFilter(v: VehicleQuery, includeYear = true): Record<string, unknown> | undefined {
  const clauses: Record<string, unknown>[] = [];
  const either = (path: string, key: string) => ({ $or: [{ [path]: { $eq: key } }, { [path]: { $eq: ANY_VEHICLE } }] });
  if (v.make?.trim()) clauses.push(either("vehicle.makeKey", vehicleKey(v.make)));
  if (v.model?.trim()) clauses.push(either("vehicle.modelKey", vehicleKey(v.model)));
  if (includeYear && v.year) clauses.push({ $or: [{ "vehicle.years": { $in: [v.year] } }, { "vehicle.yearsAll": { $eq: true } }] });
  return clauses.length === 0 ? undefined : clauses.length === 1 ? clauses[0] : { $and: clauses };
}

/**
 * Hybrid retrieval: Atlas $vectorSearch (pre-filtered by vehicle metadata) plus exact
 * metadata matches on any DTCs the technician supplied. Results are de-duplicated and
 * ranked; only chunks above RETRIEVAL_MIN_SCORE (or exact DTC matches) count as evidence.
 */
export async function retrieve(opts: RetrieveOptions): Promise<RetrievalResult> {
  const col = await getCollection();
  const [queryVector] = await embed([opts.query], "query");

  const limit = config.retrieval.limit;
  const vectorPipeline = (f: Record<string, unknown> | undefined) => [
    {
      $vectorSearch: {
        index: config.mongo.vectorIndex,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(150, limit * 15),
        limit,
        ...(f && { filter: f }),
      },
    },
    { $project: { ...projection, score: { $meta: "vectorSearchScore" } } },
  ];
  const aboveThreshold = (hits: Record<string, any>[]) => hits.some((h) => h.score >= config.retrieval.minScore);

  // Widen step by step instead of returning nothing: exact vehicle -> any year -> any vehicle.
  const hasVehicle = Boolean(opts.make?.trim() || opts.model?.trim() || opts.year);
  const ladder: { match: VehicleMatch; filter: Record<string, unknown> | undefined }[] = hasVehicle
    ? [
        { match: "exact", filter: and(KB_SCOPE, vehicleFilter(opts)) },
        ...(opts.year ? [{ match: "year_relaxed" as const, filter: and(KB_SCOPE, vehicleFilter(opts, false)) }] : []),
        { match: "any_vehicle", filter: KB_SCOPE },
      ]
    : [{ match: "unspecified", filter: KB_SCOPE }];

  let vectorHits: Record<string, any>[] = [];
  let step = ladder[0];
  for (const s of ladder) {
    step = s;
    vectorHits = await col.aggregate<Record<string, any>>(vectorPipeline(s.filter)).toArray();
    if (aboveThreshold(vectorHits)) break;
  }
  const filter = step.filter ?? {};

  // The case's own uploads are always relevant to this vehicle; search them separately so
  // they are not crowded out by the knowledge base.
  const caseFilter = opts.caseId ? { scope: { $eq: caseScope(opts.caseId) } } : undefined;
  if (caseFilter) vectorHits.push(...(await col.aggregate<Record<string, any>>(vectorPipeline(caseFilter)).toArray()));

  // A selected component boosts matching chunks rather than excluding everything else:
  // faults often originate outside the component the technician is looking at.
  const boosted: Record<string, any>[] = vectorHits.map((h) => ({
    ...h,
    rank:
      (h.score as number) +
      // Small boost for the technician's own documents about this vehicle.
      (h.scope !== "kb" ? 0.02 : 0) +
      (opts.focusComponent && (h.components as string[] | undefined)?.includes(opts.focusComponent) ? 0.03 : 0),
  }));

  const dtcHits =
    opts.dtcs.length > 0
      ? await col
          .find(
            { $and: [{ dtcs: { $in: opts.dtcs } }, caseFilter ? { $or: [step.filter ?? {}, caseFilter] } : (step.filter ?? {})] },
            { projection },
          )
          .limit(limit)
          .toArray()
      : [];

  const merged = new Map<string, Record<string, any> & { matchedBy: ("vector" | "dtc")[]; rank: number }>();
  for (const h of boosted) {
    if ((h.score as number) < config.retrieval.minScore) continue;
    merged.set(String(h._id), { ...h, rank: h.rank as number, matchedBy: ["vector"] });
  }
  for (const h of dtcHits) {
    const key = String(h._id);
    const existing = merged.get(key);
    if (existing) existing.matchedBy.push("dtc");
    else merged.set(key, { ...h, score: null, rank: 1, matchedBy: ["dtc"] });
  }

  const ranked = [...merged.values()].sort((a, b) => b.rank - a.rank).slice(0, limit + 6);
  const evidence: Evidence[] = ranked.map((h, i) => ({
    id: `S${i + 1}`,
    chunkId: String(h._id),
    docId: h.docId,
    sourceTitle: h.sourceTitle,
    sourceUri: h.sourceUri,
    docType: h.docType,
    publisher: h.publisher,
    publishedAt: h.publishedAt,
    page: h.page,
    section: h.section,
    components: h.components ?? [],
    dtcs: h.dtcs ?? [],
    language: h.language,
    vehicle: h.vehicle,
    text: h.text,
    score: typeof h.score === "number" ? Number(h.score.toFixed(4)) : null,
    matchedBy: h.matchedBy,
    origin: h.scope === "kb" || !h.scope ? "knowledge_base" : "case",
  }));

  return { evidence, filters: filter, vehicleMatch: step.match, candidatesConsidered: vectorHits.length + dtcHits.length };
}

/** Distinct knowledge-base sources tagged with a component (metadata only, no vector query). */
export async function sourcesForComponent(component: ComponentId, vehicle: VehicleQuery = {}) {
  const col = await getCollection();
  return col
    .aggregate<{
      docId: string;
      sourceTitle: string;
      docType: string;
      publisher?: string;
      publishedAt?: string;
      sourceUri?: string;
      pages: number[];
      chunks: number;
    }>([
      { $match: and(KB_SCOPE, { components: component }, vehicleFilter(vehicle, false)) ?? {} },
      {
        $group: {
          _id: "$docId",
          sourceTitle: { $first: "$sourceTitle" },
          docType: { $first: "$docType" },
          publisher: { $first: "$publisher" },
          publishedAt: { $first: "$publishedAt" },
          sourceUri: { $first: "$sourceUri" },
          pages: { $addToSet: "$page" },
          chunks: { $sum: 1 },
        },
      },
      { $sort: { chunks: -1 } },
      { $limit: 12 },
      {
        $project: {
          _id: 0,
          docId: "$_id",
          sourceTitle: 1,
          docType: 1,
          publisher: 1,
          publishedAt: 1,
          sourceUri: 1,
          chunks: 1,
          pages: {
            $sortArray: { input: { $filter: { input: "$pages", cond: { $ne: ["$$this", null] } } }, sortBy: 1 },
          },
        },
      },
    ])
    .toArray();
}
