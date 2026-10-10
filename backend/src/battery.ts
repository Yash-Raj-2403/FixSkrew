import type { CaseDoc } from "./db.js";

/**
 * Battery readings imported from the documents of a case. Values are exactly what the
 * documents state (as extracted by the model); nothing is estimated, converted or filled in.
 * The extraction records no measurement time, so readings here carry no timestamp.
 */
export type MeasurementKey = "soc" | "soh" | "pack_voltage" | "cell_voltage_max" | "cell_voltage_min" | "battery_temp" | "current" | "other";

export interface ImportedReading {
  key: MeasurementKey;
  /** Name as written in the document. */
  label: string;
  value: number;
  unit: string;
  docId: string;
  docName: string;
  context?: string;
}

export interface ImportedDtc {
  code: string;
  description?: string;
  docId: string;
  docName: string;
}

export interface ImportedBattery {
  source: "imported";
  vehicle: CaseDoc["vehicle"];
  readings: ImportedReading[];
  dtcs: ImportedDtc[];
  documents: { docId: string; name: string; uploadedAt: Date }[];
  /** Measurements in the documents whose value was not a plain number. */
  skippedReadings: number;
  generatedAt: string;
}

const RULES: [MeasurementKey, RegExp][] = [
  ["soc", /\b(soc|state[\s_-]*of[\s_-]*charge)\b/i],
  ["soh", /\b(soh|state[\s_-]*of[\s_-]*health)\b/i],
  ["cell_voltage_max", /\b(max(imum)?|highest)\b.*\bcell\b|\bcell\b.*\b(max(imum)?|highest)\b/i],
  ["cell_voltage_min", /\b(min(imum)?|lowest)\b.*\bcell\b|\bcell\b.*\b(min(imum)?|lowest)\b/i],
  ["pack_voltage", /\b(pack|battery|hv|total)\b.*\bvolt|\bvolt.*\b(pack|total)\b/i],
  ["battery_temp", /\btemp/i],
  ["current", /\bcurrent\b/i],
];

export function classify(name: string): MeasurementKey {
  for (const [key, re] of RULES) if (re.test(name)) return key;
  return "other";
}

const toNumber = (v: string): number | null => {
  const m = v.replace(/,/g, "").match(/^\s*(-?\d+(?:\.\d+)?)\s*[^\d.\-]*$/);
  return m ? Number(m[1]) : null;
};

export function batteryFromCase(c: CaseDoc): ImportedBattery {
  const readings: ImportedReading[] = [];
  const dtcs = new Map<string, ImportedDtc>();
  let skipped = 0;

  for (const d of c.documents) {
    if (d.status !== "ready") continue;
    for (const m of d.extraction?.measurements ?? []) {
      const value = toNumber(m.value);
      if (value === null) {
        skipped++;
        continue;
      }
      readings.push({ key: classify(m.name), label: m.name, value, unit: m.unit ?? "", docId: d.docId, docName: d.name, ...(m.context && { context: m.context }) });
    }
    const codes = d.extraction?.dtcs.length ? d.extraction.dtcs : d.detectedDtcs.map((code) => ({ code, description: undefined as string | undefined }));
    for (const t of codes) {
      const code = t.code.toUpperCase();
      if (!dtcs.has(code)) dtcs.set(code, { code, ...(t.description && { description: t.description }), docId: d.docId, docName: d.name });
    }
  }

  return {
    source: "imported",
    vehicle: c.vehicle,
    readings,
    dtcs: [...dtcs.values()],
    documents: c.documents.filter((d) => d.status === "ready").map((d) => ({ docId: d.docId, name: d.name, uploadedAt: d.uploadedAt })),
    skippedReadings: skipped,
    generatedAt: new Date().toISOString(),
  };
}
