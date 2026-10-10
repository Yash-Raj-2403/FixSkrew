import { MongoClient, type Collection, type Db } from "mongodb";
import { config } from "./config.js";
import type { ComponentId, DocType } from "./catalog.js";

export interface ChunkDoc {
  _id?: string;
  /** "kb" for the shared knowledge base, or "case:<caseId>" for files uploaded to a case. */
  scope: string;
  docId: string;
  sourceTitle: string;
  sourceUri?: string;
  docType: DocType;
  publisher?: string;
  publishedAt?: string;
  /**
   * Applicability. Documents without a make/model apply to all vehicles and carry the
   * wildcard key "*"; documents without years apply to every model year.
   */
  vehicle: {
    make?: string;
    model?: string;
    years?: number[];
    makeKey: string;
    modelKey: string;
    yearsAll: boolean;
  };
  components: ComponentId[];
  dtcs: string[];
  language: string;
  page?: number;
  section?: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  embeddingModel: string;
  ingestedAt: Date;
}

let client: MongoClient | null = null;
let connecting: Promise<MongoClient> | null = null;

export function mongoConfigured(): boolean {
  return Boolean(config.mongo.uri);
}

async function getDb(): Promise<Db> {
  if (!config.mongo.uri) throw new ServiceNotConfiguredError("MongoDB Atlas (MONGODB_URI)");
  if (!client) {
    connecting ??= new MongoClient(config.mongo.uri, {
      appName: "fixskrew",
      serverSelectionTimeoutMS: 8000,
    })
      .connect()
      .then((c) => {
        client = c;
        return c;
      })
      .finally(() => {
        connecting = null;
      });
    await connecting;
  }
  return client!.db(config.mongo.db);
}

export async function getCollection(): Promise<Collection<ChunkDoc>> {
  return (await getDb()).collection<ChunkDoc>(config.mongo.collection);
}

export async function getCases(): Promise<Collection<CaseDoc>> {
  return (await getDb()).collection<CaseDoc>("cases");
}

export const caseScope = (caseId: string) => `case:${caseId}`;

export interface CaseVehicle {
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  batteryVariant?: string;
  odometerKm?: number;
  vin?: string;
}

/** Facts the language model pulled out of an uploaded document. */
export interface DocumentExtraction {
  documentKind: string;
  summary: string;
  vehicle: { make?: string; model?: string; year?: number };
  dtcs: { code: string; description?: string }[];
  measurements: { name: string; value: string; unit?: string; context?: string }[];
  components: ComponentId[];
  /** Set when only part of a very long document was read for extraction. */
  coverageNote?: string;
}

export interface CaseDocument {
  docId: string;
  name: string;
  size: number;
  status: "ready" | "failed";
  error?: string;
  pages?: number;
  chunks: number;
  characters: number;
  /** DTC-format codes found by pattern matching in the text. */
  detectedDtcs: string[];
  extraction?: DocumentExtraction;
  extractionError?: string;
  uploadedAt: Date;
}

export interface SourceRef {
  id: string;
  chunkId: string;
  docId: string;
  sourceTitle: string;
  sourceUri?: string;
  docType: string;
  origin: "case" | "knowledge_base";
  page?: number;
  section?: string;
  publisher?: string;
  publishedAt?: string;
  language: string;
  vehicle: { make?: string; model?: string; years?: number[] };
  components: string[];
  dtcs: string[];
  excerpt: string;
  score: number | null;
  matchedBy: ("vector" | "dtc")[];
}

export interface CaseMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
  createdAt: Date;
}

export interface CaseDoc {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle: CaseVehicle;
  documents: CaseDocument[];
  messages: CaseMessage[];
  lastReport?: unknown;
}

export async function closeMongo(): Promise<void> {
  await client?.close();
  client = null;
}

export class ServiceNotConfiguredError extends Error {
  constructor(public readonly service: string) {
    super(`${service} is not configured on the diagnostic service.`);
    this.name = "ServiceNotConfiguredError";
  }
}
