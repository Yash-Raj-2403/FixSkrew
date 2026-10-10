import { config } from "./config.js";
import { retrieve, type Evidence, type VehicleMatch } from "./retrieval.js";
import { generateReport, translateForRetrieval, type Report } from "./llm.js";
import type { DiagnoseRequest } from "./schemas.js";

export interface DiagnoseResponse {
  status: Report["status"];
  report: Report | null;
  sources: (Omit<Evidence, "text"> & { excerpt: string })[];
  retrieval: {
    query: string;
    translated: boolean;
    filters: Record<string, unknown>;
    vehicleMatch: VehicleMatch;
    candidatesConsidered: number;
    evidenceCount: number;
    embeddingModel: string;
  };
  integrity: { droppedCitations: number; droppedUnsupportedItems: number };
  model: string | null;
  generatedAt: string;
}

export function buildQuery(input: DiagnoseRequest): string {
  const parts = [input.symptoms];
  if (input.dtcs.length) parts.push(`DTC ${input.dtcs.join(" ")}`);
  if (input.measurements.length)
    parts.push(input.measurements.map((m) => `${m.name} ${m.value}${m.unit ? ` ${m.unit}` : ""}`).join(", "));
  if (input.focusComponent) parts.push(input.focusComponent.replace(/-/g, " "));
  return parts.join("\n");
}

/** Remove citations to ids that were never retrieved; drop causes/checks left with no support. */
function enforceGrounding(report: Report, evidence: Evidence[]) {
  const valid = new Set(evidence.map((e) => e.id));
  let droppedCitations = 0;
  let droppedUnsupportedItems = 0;
  const clean = (ids: string[]) => {
    const kept = ids.filter((id) => valid.has(id));
    droppedCitations += ids.length - kept.length;
    return kept;
  };
  const keepSupported = <T extends { evidence_ids: string[] }>(items: T[]) =>
    items
      .map((it) => ({ ...it, evidence_ids: clean(it.evidence_ids) }))
      .filter((it) => {
        const ok = it.evidence_ids.length > 0;
        if (!ok) droppedUnsupportedItems++;
        return ok;
      });

  const grounded: Report = {
    ...report,
    verified_findings: keepSupported(report.verified_findings),
    possible_causes: keepSupported(report.possible_causes),
    recommended_checks: keepSupported(report.recommended_checks),
  };
  return { report: grounded, droppedCitations, droppedUnsupportedItems };
}

export function toSource(e: Evidence) {
  const { text, ...rest } = e;
  return { ...rest, excerpt: text.length > 700 ? `${text.slice(0, 700)}…` : text };
}

export async function diagnose(
  input: DiagnoseRequest,
  opts: { caseId?: string; caseContext?: string } = {},
): Promise<DiagnoseResponse> {
  let query = buildQuery(input);
  let translated = false;
  if (!config.embeddings.multilingual) {
    query = await translateForRetrieval(query);
    translated = true;
  }

  const { evidence, filters, vehicleMatch, candidatesConsidered } = await retrieve({
    query,
    make: input.vehicle.make,
    model: input.vehicle.model,
    year: input.vehicle.year,
    caseId: opts.caseId,
    dtcs: input.dtcs,
    focusComponent: input.focusComponent,
  });

  const base = {
    retrieval: {
      query,
      translated,
      filters,
      vehicleMatch,
      candidatesConsidered,
      evidenceCount: evidence.length,
      embeddingModel: config.embeddings.model,
    },
    generatedAt: new Date().toISOString(),
  };

  // Nothing relevant in the knowledge base: say so without asking the model to improvise.
  if (evidence.length === 0) {
    return {
      ...base,
      status: "insufficient_evidence",
      report: null,
      sources: [],
      integrity: { droppedCitations: 0, droppedUnsupportedItems: 0 },
      model: null,
    };
  }

  const raw = await generateReport(input, evidence, vehicleMatch, opts.caseContext);
  const { report, droppedCitations, droppedUnsupportedItems } = enforceGrounding(raw, evidence);
  const cited = new Set(
    [...report.verified_findings, ...report.possible_causes, ...report.recommended_checks].flatMap((i) => i.evidence_ids),
  );

  return {
    ...base,
    status: report.status,
    report,
    // Cited sources first, then the rest of what was retrieved.
    sources: [...evidence.filter((e) => cited.has(e.id)), ...evidence.filter((e) => !cited.has(e.id))].map(toSource),
    integrity: { droppedCitations, droppedUnsupportedItems },
    model: config.llm.model,
  };
}
