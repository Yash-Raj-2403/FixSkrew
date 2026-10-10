import { useState } from "react";
import { COMPONENT_BY_ID, type ComponentId } from "../data/components";
import { DOC_TYPE_LABEL, type DiagnoseResult, type Source } from "../lib/api";
import { showComponentInfo } from "../lib/router";
import { LinkPreview } from "./ui/link-preview";

function sourceMeta(s: Source) {
  return [DOC_TYPE_LABEL[s.docType] ?? s.docType, s.page != null && `p. ${s.page}`, s.section, s.publishedAt].filter(Boolean).join(" · ");
}

function SourceCard({ s }: { s: Source }) {
  return (
    <>
      <p className="flex items-start gap-2 text-[13px] leading-snug font-medium text-fog-100">
        <span className="mt-px rounded bg-volt-400/10 px-1.5 py-px font-mono text-[10px] text-volt-300">{s.id}</span>
        {s.sourceTitle}
      </p>
      <p className="mt-1 font-mono text-[10.5px] text-fog-500">{sourceMeta(s)}</p>
      <p className="mt-2 line-clamp-4 border-l border-white/10 pl-2.5 text-[12px] leading-relaxed text-fog-400">{s.excerpt}</p>
    </>
  );
}

function Cite({ ids, sources }: { ids: string[]; sources: Map<string, Source> }) {
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {ids.map((id) => {
        const s = sources.get(id);
        const chip = "rounded bg-volt-400/10 px-1.5 py-px font-mono text-[10.5px] text-volt-300 transition-colors hover:bg-volt-400/20";
        return s ? (
          <LinkPreview key={id} url={`#source-${id}`} mode="card" card={<SourceCard s={s} />} className={chip} aria-label={`Source ${id}: ${s.sourceTitle}`}>
            {id}
          </LinkPreview>
        ) : (
          <a key={id} href={`#source-${id}`} className={chip}>
            {id}
          </a>
        );
      })}
    </span>
  );
}

function ComponentChips({ ids }: { ids: ComponentId[] }) {
  if (!ids.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => showComponentInfo(id)}
          className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-fog-400 transition-colors hover:border-volt-400/50 hover:text-volt-300"
          title="Show component details"
        >
          {COMPONENT_BY_ID[id]?.short ?? id} ↗
        </button>
      ))}
    </div>
  );
}

function Section({ title, children, count }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/[0.07] px-5 py-5 sm:px-7">
      <h3 className="eyebrow mb-3 text-[10px]!">
        {title}
        {count != null && <span className="ml-2 text-fog-500">{count}</span>}
      </h3>
      {children}
    </section>
  );
}

function SourceItem({ s }: { s: Source }) {
  const [open, setOpen] = useState(false);
  return (
    <li id={`source-${s.id}`} className="scroll-mt-28 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 target:border-volt-400/50">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded bg-volt-400/10 px-1.5 py-px font-mono text-[10.5px] text-volt-300">{s.id}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-fog-100">
            {s.sourceUri ? (
              <LinkPreview url={s.sourceUri} target="_blank" mode="card" card={<SourceCard s={s} />} className="hover:text-volt-300">
                {s.sourceTitle}
              </LinkPreview>
            ) : (
              s.sourceTitle
            )}
          </p>
          <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-fog-500">
            {[
              DOC_TYPE_LABEL[s.docType] ?? s.docType,
              s.page != null && `page ${s.page}`,
              s.section,
              s.publisher,
              s.publishedAt,
              s.language && s.language.toUpperCase(),
              s.score != null ? `similarity ${s.score.toFixed(3)}` : null,
              s.matchedBy.includes("dtc") && `DTC match ${s.dtcs.join(" ")}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 text-[11px] text-volt-400 hover:text-volt-300" aria-expanded={open}>
            {open ? "Hide excerpt" : "Show excerpt"}
          </button>
          {open && <p className="mt-2 border-l border-white/10 pl-3 text-[13px] leading-relaxed whitespace-pre-line text-fog-400">{s.excerpt}</p>}
        </div>
      </div>
    </li>
  );
}

const STATUS_COPY = {
  report: { label: "Investigation report", tone: "text-volt-300 border-volt-400/40 bg-volt-400/[0.07]" },
  needs_information: { label: "More information needed", tone: "text-amber-hv border-amber-hv/40 bg-amber-hv/[0.07]" },
  insufficient_evidence: { label: "Insufficient evidence", tone: "text-fog-300 border-white/15 bg-white/[0.04]" },
} as const;

export function Report({ result }: { result: DiagnoseResult }) {
  const { report, sources, retrieval, integrity } = result;
  const status = STATUS_COPY[result.status];
  const byId = new Map(sources.map((s) => [s.id, s]));

  return (
    <article>
      <header className="px-5 pt-5 pb-5 sm:px-7 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${status.tone}`}>{status.label}</span>
          <span className="font-mono text-[10.5px] text-fog-500">
            {new Date(result.generatedAt).toLocaleString()} {result.model && `· ${result.model}`}
          </span>
        </div>
        {(retrieval.vehicleMatch === "any_vehicle" || retrieval.vehicleMatch === "year_relaxed") && (
          <p className="mt-4 rounded-lg border border-amber-hv/30 bg-amber-hv/[0.06] px-3 py-2 text-[13px] leading-relaxed text-amber-hv">
            {retrieval.vehicleMatch === "any_vehicle"
              ? "No knowledge-base documents match this vehicle. Knowledge-base evidence below comes from other vehicles or general documentation, so confirm every value against this vehicle's own service information. Your uploaded documents are unaffected."
              : "No knowledge-base documents match this model year. Knowledge-base evidence below is for other years of the same vehicle or general documentation."}
          </p>
        )}
        {report ? (
          <p className="mt-4 text-[15px] leading-relaxed text-fog-100">{report.summary}</p>
        ) : (
          <div className="mt-4 space-y-2 text-[15px] leading-relaxed">
            <p className="text-fog-100">The knowledge base has no evidence that addresses this fault.</p>
            <p className="text-sm text-fog-400">
              No passage matched closely enough to support an investigation. Add detail such as DTCs, when the fault occurs and any
              measurements, or check that the relevant service documentation has been ingested. Until then, have the high-voltage
              system inspected by a qualified technician.
            </p>
          </div>
        )}
      </header>

      {report && (
        <>
          {report.safety_notes.length > 0 && (
            <section className="mx-5 mb-5 rounded-xl border border-amber-hv/30 bg-amber-hv/[0.06] px-4 py-3 sm:mx-7">
              <h3 className="mb-1.5 text-xs font-medium text-amber-hv">High-voltage safety</h3>
              <ul className="space-y-1 text-[13px] leading-relaxed text-fog-300">
                {report.safety_notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          )}

          <Section title="Verified findings" count={report.verified_findings.length}>
            {report.verified_findings.length === 0 ? (
              <p className="text-sm text-fog-500">Nothing is verified yet. The supplied data does not directly confirm a fault in the sources.</p>
            ) : (
              <ul className="space-y-3">
                {report.verified_findings.map((f, i) => (
                  <li key={i} className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] p-3.5">
                    <p className="text-sm leading-relaxed text-fog-100">
                      {f.statement}
                      <Cite ids={f.evidence_ids} sources={byId} />
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-fog-400">Basis: {f.basis}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {report.possible_causes.length > 0 && (
            <Section title="Possible causes · not verified" count={report.possible_causes.length}>
              <ol className="space-y-3">
                {report.possible_causes.map((c, i) => (
                  <li key={i} className="rounded-xl border border-white/[0.07] p-3.5">
                    <p className="text-sm font-medium text-fog-100">
                      <span className="mr-2 font-mono text-xs text-fog-500">{String(i + 1).padStart(2, "0")}</span>
                      {c.title}
                      <Cite ids={c.evidence_ids} sources={byId} />
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fog-300">{c.explanation}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-fog-500">{c.reasoning}</p>
                    <ComponentChips ids={c.components} />
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {report.recommended_checks.length > 0 && (
            <Section title="Recommended checks" count={report.recommended_checks.length}>
              <ol className="space-y-2.5">
                {report.recommended_checks.map((c, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-white/15 font-mono text-[10px] text-fog-400">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm leading-relaxed text-fog-100">
                        {c.step}
                        {c.high_voltage && (
                          <span className="ml-2 rounded-full border border-amber-hv/40 px-1.5 py-px align-middle text-[10px] text-amber-hv">HV</span>
                        )}
                        <Cite ids={c.evidence_ids} sources={byId} />
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-fog-500">{c.purpose}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {report.missing_information.length > 0 && (
            <Section title="Information that would sharpen the investigation">
              <ul className="space-y-2">
                {report.missing_information.map((m, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    <span className="text-fog-100">{m.item}</span>
                    <span className="text-fog-500"> — {m.why_needed}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {report.related_components.length > 0 && (
            <Section title="Related components">
              <ComponentChips ids={report.related_components} />
            </Section>
          )}
        </>
      )}

      <Section title="Sources" count={sources.length}>
        {sources.length === 0 ? (
          <p className="text-sm text-fog-500">No sources were retrieved.</p>
        ) : (
          <ul className="space-y-2.5">
            {sources.map((s) => (
              <SourceItem key={s.chunkId} s={s} />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Retrieval details">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 font-mono text-[11px] text-fog-500 sm:grid-cols-2">
          <div>
            <dt className="inline text-fog-400">Embedding model: </dt>
            <dd className="inline">{retrieval.embeddingModel}</dd>
          </div>
          <div>
            <dt className="inline text-fog-400">Evidence passages: </dt>
            <dd className="inline">
              {retrieval.evidenceCount} of {retrieval.candidatesConsidered} candidates
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="inline text-fog-400">Metadata filters: </dt>
            <dd className="inline break-all">{JSON.stringify(retrieval.filters)}</dd>
          </div>
          {retrieval.translated && (
            <div className="sm:col-span-2">
              <dt className="inline text-fog-400">Query translated for retrieval: </dt>
              <dd className="inline">{retrieval.query}</dd>
            </div>
          )}
          {(integrity.droppedCitations > 0 || integrity.droppedUnsupportedItems > 0) && (
            <div className="sm:col-span-2">
              <dt className="inline text-fog-400">Grounding check: </dt>
              <dd className="inline">
                removed {integrity.droppedCitations} invalid citation(s) and {integrity.droppedUnsupportedItems} unsupported item(s)
              </dd>
            </div>
          )}
        </dl>
      </Section>
    </article>
  );
}
