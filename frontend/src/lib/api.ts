import type { ComponentId } from "../data/components";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

export type ServiceState = "ready" | "not_configured" | "unreachable";

export interface Health {
  ready: boolean;
  services: { database: ServiceState; embeddings: ServiceState; llm: ServiceState };
  knowledgeBase: { chunks: number | null; sources: number | null; vehicles: { make?: string; model?: string }[] };
  models: { embedding: string; llm: string };
  multilingual: "embedding" | "translation";
}

export interface DiagnoseInput {
  vehicle: {
    make?: string;
    model?: string;
    year?: number;
    trim?: string;
    batteryVariant?: string;
    odometerKm?: number;
    vin?: string;
  };
  symptoms: string;
  dtcs: string[];
  measurements: { name: string; value: string; unit?: string }[];
  focusComponent?: ComponentId;
  language: string;
}

export interface Source {
  id: string;
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
  excerpt: string;
  score: number | null;
  matchedBy: ("vector" | "dtc")[];
  origin?: "case" | "knowledge_base";
}

export interface Report {
  status: "report" | "needs_information" | "insufficient_evidence";
  language: string;
  summary: string;
  verified_findings: { statement: string; evidence_ids: string[]; basis: string }[];
  possible_causes: {
    title: string;
    explanation: string;
    reasoning: string;
    evidence_ids: string[];
    components: ComponentId[];
  }[];
  recommended_checks: { step: string; purpose: string; evidence_ids: string[]; high_voltage: boolean }[];
  missing_information: { item: string; why_needed: string }[];
  safety_notes: string[];
  related_components: ComponentId[];
}

export interface DiagnoseResult {
  status: Report["status"];
  report: Report | null;
  sources: Source[];
  retrieval: {
    query: string;
    translated: boolean;
    filters: Record<string, unknown>;
    vehicleMatch: "exact" | "year_relaxed" | "any_vehicle" | "unspecified";
    candidatesConsidered: number;
    evidenceCount: number;
    embeddingModel: string;
  };
  integrity: { droppedCitations: number; droppedUnsupportedItems: number };
  model: string | null;
  generatedAt: string;
}

export interface ComponentSource {
  docId: string;
  sourceTitle: string;
  docType: string;
  publisher?: string;
  publishedAt?: string;
  sourceUri?: string;
  pages: number[];
  chunks: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public issues?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("The diagnostic service could not be reached.", 0, "unreachable");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || body === null) {
    throw new ApiError(
      body?.message ?? `The diagnostic service returned an error (${res.status}).`,
      res.status,
      body?.error ?? "http_error",
      body?.issues,
    );
  }
  return body as T;
}

/* ---------------------------------- cases ---------------------------------- */

export interface Vehicle {
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  batteryVariant?: string;
  odometerKm?: number;
  vin?: string;
}

export interface DocumentExtraction {
  documentKind: string;
  summary: string;
  vehicle: { make?: string; model?: string; year?: number };
  dtcs: { code: string; description?: string }[];
  measurements: { name: string; value: string; unit?: string; context?: string }[];
  components: ComponentId[];
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
  detectedDtcs: string[];
  extraction?: DocumentExtraction;
  extractionError?: string;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt: string;
}

export interface Case {
  id: string;
  createdAt: string;
  updatedAt: string;
  vehicle: Vehicle;
  documents: CaseDocument[];
  messages: ChatMessage[];
  hasReport: boolean;
}

export type UploadResult = { ok: true; document: CaseDocument } | { ok: false; name: string; message: string };

/** Upload files with byte-level progress (fetch has no upload progress events). */
function uploadWithProgress(url: string, files: File[], onProgress: (fraction: number) => void) {
  return new Promise<{ results: UploadResult[]; case: Case }>((resolve, reject) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f, f.name));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(new ApiError("The diagnostic service could not be reached.", 0, "unreachable"));
    xhr.onload = () => {
      const body = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300 && body) resolve(body);
      else reject(new ApiError(body?.message ?? `Upload failed (${xhr.status}).`, xhr.status, body?.error ?? "http_error"));
    };
    xhr.send(form);
  });
}

export interface ChatHandlers {
  onSources: (sources: Source[], vehicleMatch: DiagnoseResult["retrieval"]["vehicleMatch"]) => void;
  onDelta: (text: string) => void;
  onDone: (messages: { user: ChatMessage; assistant: ChatMessage }) => void;
  onError: (message: string) => void;
}

/** POST a chat message and consume the Server-Sent Events reply. */
async function chatStream(caseId: string, message: string, language: string, h: ChatHandlers, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/cases/${caseId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language }),
      signal,
    });
  } catch {
    if (!signal?.aborted) h.onError("The diagnostic service could not be reached.");
    return;
  }
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    h.onError(body?.message ?? `The diagnostic service returned an error (${res.status}).`);
    return;
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let finished = false;
  for (;;) {
    const { value, done } = await reader.read().catch(() => ({ value: undefined, done: true }));
    if (done) break;
    buffer += value;
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const event = raw.match(/^event: (.+)$/m)?.[1];
      const data = raw.match(/^data: (.+)$/m)?.[1];
      if (!event || !data) continue;
      const payload = JSON.parse(data);
      if (event === "sources") h.onSources(payload.sources, payload.vehicleMatch);
      else if (event === "delta") h.onDelta(payload.text);
      else if (event === "done") {
        finished = true;
        h.onDone(payload);
      } else if (event === "error") {
        finished = true;
        h.onError(payload.message);
      }
    }
  }
  if (!finished && !signal?.aborted) h.onError("The reply was interrupted.");
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>("/api/health", { signal }),
  diagnose: (input: DiagnoseInput, signal?: AbortSignal) =>
    request<DiagnoseResult>("/api/diagnose", { method: "POST", body: JSON.stringify(input), signal }),
  createCase: (vehicle: Vehicle = {}) => request<Case>("/api/cases", { method: "POST", body: JSON.stringify({ vehicle }) }),
  getCase: (id: string, signal?: AbortSignal) => request<Case>(`/api/cases/${id}`, { signal }),
  deleteCase: (id: string) => fetch(`${BASE}/api/cases/${id}`, { method: "DELETE" }),
  updateVehicle: (id: string, vehicle: Vehicle) => request<Case>(`/api/cases/${id}/vehicle`, { method: "PUT", body: JSON.stringify(vehicle) }),
  uploadDocuments: (id: string, files: File[], onProgress: (fraction: number) => void) =>
    uploadWithProgress(`${BASE}/api/cases/${id}/documents`, files, onProgress),
  removeDocument: (id: string, docId: string) => request<Case>(`/api/cases/${id}/documents/${docId}`, { method: "DELETE" }),
  chat: chatStream,
  generateReport: (id: string, language: string) =>
    request<DiagnoseResult>(`/api/cases/${id}/report`, { method: "POST", body: JSON.stringify({ language }) }),
  getReport: (id: string, signal?: AbortSignal) => request<DiagnoseResult>(`/api/cases/${id}/report`, { signal }),
  componentSources: (id: ComponentId, signal?: AbortSignal) =>
    request<{ component: ComponentId; sources: ComponentSource[] }>(`/api/components/${id}/sources`, { signal }),
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  service_manual: "Service manual",
  technical_service_bulletin: "Technical service bulletin",
  recall_notice: "Recall notice",
  diagnostic_log: "Diagnostic log",
  repair_history: "Repair history",
  component_spec: "Component specification",
  uploaded_document: "Uploaded to this case",
  other: "Document",
};
