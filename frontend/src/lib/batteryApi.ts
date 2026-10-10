import { ApiError } from "./api";
import type { BatteryDataset, Dtc, MeasurementKey, Reading } from "./battery";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
const CASE_KEY = "fixskrew.caseId";

/** Shape returned by GET /api/cases/:id/battery (see backend/src/battery.ts). */
interface ImportedPayload {
  vehicle: { make?: string; model?: string; year?: number };
  readings: { key: MeasurementKey; label: string; value: number; unit: string; docId: string; docName: string }[];
  dtcs: { code: string; description?: string; docName: string }[];
  documents: { docId: string; name: string }[];
  skippedReadings: number;
  generatedAt: string;
}

export function storedCaseId(): string | null {
  try {
    return localStorage.getItem(CASE_KEY);
  } catch {
    return null;
  }
}

/**
 * Battery readings found in the documents of the current diagnosis case.
 * Returns null when there is no case yet. Throws ApiError when the service fails.
 */
export async function fetchImportedDataset(caseId: string, signal?: AbortSignal): Promise<BatteryDataset | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/cases/${caseId}/battery`, { signal });
  } catch {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    throw new ApiError("The diagnostic service could not be reached.", 0, "unreachable");
  }
  if (res.status === 404) return null; // the stored case no longer exists
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) throw new ApiError(body?.message ?? `The diagnostic service returned an error (${res.status}).`, res.status, body?.error ?? "http_error");

  const p = body as ImportedPayload;
  const name = [p.vehicle.make, p.vehicle.model, p.vehicle.year].filter(Boolean).join(" ");
  const readings: Reading[] = p.readings.map((r) => ({ key: r.key, label: r.label, value: r.value, unit: r.unit, groupId: r.docId, sourceName: r.docName }));
  const dtcs: Dtc[] = p.dtcs.map((d) => ({ code: d.code, description: d.description, sourceName: d.docName }));
  return {
    source: "imported",
    sourceLabel: "Imported dataset",
    sourceDetail: `Values stated in ${p.documents.length} uploaded document${p.documents.length === 1 ? "" : "s"}, read by the diagnostic service. The documents give no measurement times, so there is no history.`,
    vehicle: { label: name || "Vehicle not specified", known: Boolean(name) },
    readings,
    dtcs,
    fetchedAt: p.generatedAt,
    skippedReadings: p.skippedReadings,
  };
}
