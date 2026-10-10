import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COMPONENT_BY_ID, type ComponentId } from "../data/components";
import { api, ApiError, DOC_TYPE_LABEL, type ComponentSource } from "../lib/api";
import { setUi, useUi } from "../lib/store";
import { openDiagnosis } from "../lib/router";
import { scrollToHeroProgress } from "../lib/scroll";
import { EncryptedText } from "./ui/encrypted-text";
import { LinkPreview } from "./ui/link-preview";

type SourcesState =
  | { kind: "loading" }
  | { kind: "ok"; sources: ComponentSource[] }
  | { kind: "error"; message: string; offline: boolean };

function useComponentSources(id: ComponentId | null) {
  const [state, setState] = useState<SourcesState>({ kind: "loading" });
  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    setState({ kind: "loading" });
    api
      .componentSources(id, ctrl.signal)
      .then((r) => setState({ kind: "ok", sources: r.sources }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const e = err instanceof ApiError ? err : null;
        setState({
          kind: "error",
          message: e?.message ?? "Could not load sources.",
          offline: !e || e.status === 0 || e.status === 503,
        });
      });
    return () => ctrl.abort();
  }, [id]);
  return state;
}

function Sources({ id }: { id: ComponentId }) {
  const state = useComponentSources(id);
  if (state.kind === "loading")
    return <p className="text-xs text-fog-500">Checking the knowledge base…</p>;
  if (state.kind === "error")
    return (
      <p className="text-xs leading-relaxed text-fog-400">
        {state.offline ? "Connect the diagnostic service to see documents for this component." : state.message}
      </p>
    );
  if (state.sources.length === 0)
    return (
      <p className="text-xs leading-relaxed text-fog-400">
        No documents in the knowledge base are tagged with this component yet.
      </p>
    );
  return (
    <ul className="space-y-2">
      {state.sources.map((s) => (
        <li key={s.docId} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
          <p className="text-[13px] leading-snug text-fog-100">
            {s.sourceUri ? (
              <LinkPreview
                url={s.sourceUri}
                target="_blank"
                mode="card"
                className="hover:text-volt-300"
                card={
                  <>
                    <p className="text-[13px] font-medium text-fog-100">{s.sourceTitle}</p>
                    <p className="mt-1 font-mono text-[10.5px] text-fog-500">
                      {DOC_TYPE_LABEL[s.docType] ?? s.docType} · {s.chunks} passage{s.chunks === 1 ? "" : "s"}
                    </p>
                    <p className="mt-2 truncate font-mono text-[10.5px] text-volt-300/80">{s.sourceUri}</p>
                  </>
                }
              >
                {s.sourceTitle}
              </LinkPreview>
            ) : (
              s.sourceTitle
            )}
          </p>
          <p className="mt-0.5 font-mono text-[10.5px] text-fog-500">
            {DOC_TYPE_LABEL[s.docType] ?? s.docType}
            {s.pages.length > 0 && ` · p. ${s.pages.slice(0, 6).join(", ")}${s.pages.length > 6 ? "…" : ""}`}
            {s.publishedAt && ` · ${s.publishedAt}`}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ComponentPanel({ className = "" }: { className?: string }) {
  const selected = useUi((s) => s.selected);
  const c = selected ? COMPONENT_BY_ID[selected] : null;

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUi({ selected: null });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <AnimatePresence>
      {c && (
        <motion.aside
          key={c.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`glass pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-2xl ${className}`}
          aria-label={`${c.name} details`}
          role="dialog"
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 pt-4 pb-3.5">
            <div>
              <p className="eyebrow text-[10px]! text-volt-400!">Selected component</p>
              <h3 className="mt-1 text-lg font-semibold leading-tight text-fog-100">
                <EncryptedText text={c.name} revealDelayMs={22} encryptedClassName="text-volt-600" />
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.highVoltage ? (
                  <span className="rounded-full border border-amber-hv/40 bg-amber-hv/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-hv">
                    High voltage
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10.5px] text-fog-400">
                    Low voltage / structural
                  </span>
                )}
                {c.subtitle && (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10.5px] text-fog-400">{c.subtitle}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUi({ selected: null })}
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-fog-400 transition-colors hover:bg-white/10 hover:text-fog-100"
              aria-label="Close details"
            >
              <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                <path d="M2 2l8 8M10 2 2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
            <section>
              <h4 className="eyebrow mb-1.5 text-[10px]!">Function</h4>
              <p className="leading-relaxed text-fog-300">{c.function}</p>
            </section>
            <section>
              <h4 className="eyebrow mb-1.5 text-[10px]!">Diagnostic relevance</h4>
              <ul className="space-y-1.5">
                {c.diagnosticRelevance.map((d) => (
                  <li key={d} className="flex gap-2 leading-relaxed text-fog-300">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-volt-400" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="eyebrow mb-2 text-[10px]!">Knowledge-base documents</h4>
              <Sources id={c.id} />
            </section>
            <p className="text-[11px] leading-relaxed text-fog-500">
              General system description. Vehicle-specific values come from the documents in your knowledge base.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/[0.07] px-5 py-3.5">
            <button
              type="button"
              onClick={() => {
                setUi({ agentFocus: c.id });
                openDiagnosis();
              }}
              className="flex-1 rounded-full bg-volt-400 px-4 py-2 text-sm font-medium text-ink-900 transition-all hover:bg-volt-300 hover:shadow-[0_0_24px_rgba(63,216,242,0.45)]"
            >
              Investigate this component →
            </button>
            <button
              type="button"
              onClick={() => {
                setUi({ selected: null });
                scrollToHeroProgress(0);
              }}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-fog-300 transition-colors hover:border-white/30 hover:text-fog-100"
            >
              Full vehicle view
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
