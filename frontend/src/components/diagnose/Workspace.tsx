import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useHealth, type HealthState } from "../../lib/useHealth";
import { useCase, type CaseState } from "../../lib/useCase";
import { setUi, useUi } from "../../lib/store";
import { Report } from "../Report";
import { EncryptedText } from "../ui/encrypted-text";
import { SquigglyText } from "../ui/squiggly-text";
import { DocumentsCard } from "./CasePanels";
import { VehicleCard } from "./VehicleCard";
import { ChatPanel } from "./ChatPanel";
import { BatteryMap } from "./BatteryMap";
import { BatteryDashboard } from "../battery/BatteryDashboard";
import { VisualLocator } from "./VisualLocator";

function serviceLabel(s: string) {
  return s === "ready" ? "Ready" : s === "not_configured" ? "Not configured" : "Unreachable";
}

function ServiceStatus({ state, onRetry }: { state: HealthState; onRetry: () => void }) {
  if (state.kind === "loading") return <p className="font-mono text-xs text-fog-500">Checking diagnostic service…</p>;
  if (state.kind === "offline")
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="flex items-center gap-2 text-fog-400">
          <span className="size-2 rounded-full bg-red-400/80" /> Diagnostic service offline
        </span>
        <button type="button" onClick={onRetry} className="text-volt-400 hover:text-volt-300">
          Retry
        </button>
      </div>
    );
  const { health } = state;
  const rows = [
    ["MongoDB Atlas", health.services.database],
    ["Embeddings", health.services.embeddings],
    ["Language model", health.services.llm],
  ] as const;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      {rows.map(([label, s]) => (
        <span key={label} className="flex items-center gap-2 text-fog-400">
          <span className={`size-2 rounded-full ${s === "ready" ? "bg-emerald-400" : s === "not_configured" ? "bg-amber-hv" : "bg-red-400"}`} />
          {label}: <span className="text-fog-300">{serviceLabel(s)}</span>
        </span>
      ))}
      {health.services.database === "ready" && (
        <span className="text-fog-500">
          Knowledge base: {health.knowledgeBase.sources ?? 0} sources · {health.knowledgeBase.chunks ?? 0} passages
        </span>
      )}
    </div>
  );
}

const STEPS = [
  { title: "Fault input", hint: "Files & chat" },
  { title: "Evidence retrieval", hint: "Searching sources" },
  { title: "AI analysis", hint: "Reasoning" },
  { title: "Investigation report", hint: "Verified findings" },
];

function Workflow({ state }: { state: CaseState }) {
  const hasInput = state.messages.length > 0 || (state.data?.documents.length ?? 0) > 0;
  const working = Boolean(state.turn && !state.turn.error) || state.reportState.kind === "running" || state.uploads.some((u) => u.stage !== "failed");
  const done = [hasInput, hasInput && state.messages.length > 0, state.messages.length > 0, Boolean(state.report)];
  return (
    <ol className="relative grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Investigation workflow">
      <span className="pointer-events-none absolute top-[27px] right-[12.5%] left-[12.5%] hidden h-px bg-white/10 sm:block" />
      {STEPS.map((s, i) => {
        const running = working && (i === 1 || i === 2);
        return (
          <li key={s.title} className="relative flex flex-col items-center text-center">
            <span
              className={`relative z-10 grid size-14 place-items-center rounded-full border font-mono text-sm transition-all duration-500 ${
                done[i]
                  ? "border-volt-400 bg-volt-400/15 text-volt-300 shadow-[0_0_28px_-4px_rgba(63,216,242,0.55)]"
                  : running
                    ? "border-volt-400/60 bg-ink-900 text-volt-300"
                    : "border-white/10 bg-ink-900 text-fog-500"
              }`}
            >
              {running && <span className="absolute inset-0 animate-ping rounded-full border border-volt-400/50 motion-reduce:animate-none" />}
              {done[i] && !running ? (
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m5 12 5 5L20 7" />
                </svg>
              ) : (
                `0${i + 1}`
              )}
            </span>
            <p className={`mt-2.5 text-[13px] ${done[i] || running ? "text-fog-100" : "text-fog-400"}`}>{s.title}</p>
            <p className="text-[11px] text-fog-500">{running ? "Working…" : s.hint}</p>
          </li>
        );
      })}
    </ol>
  );
}

function notReadyReason(h: HealthState): string {
  if (h.kind === "loading") return "Checking the diagnostic service…";
  if (h.kind === "offline") return "Connect the diagnostic service to begin an investigation.";
  const missing = Object.entries(h.health.services)
    .filter(([, s]) => s !== "ready")
    .map(([k]) => (k === "database" ? "MongoDB Atlas" : k === "embeddings" ? "the embedding model" : "the language model"));
  return missing.length ? `Connect the diagnostic service to begin an investigation (still needed: ${missing.join(", ")}).` : "";
}

function ReportTab({ state, language }: { state: CaseState; language: string }) {
  const canGenerate = state.messages.length > 0 || (state.data?.documents.some((d) => d.status === "ready") ?? false);
  const running = state.reportState.kind === "running";
  const latestMessage = state.messages.at(-1)?.createdAt;
  const stale = state.report && latestMessage && new Date(latestMessage) > new Date(state.report.generatedAt);

  return (
    <div className="min-h-[480px]">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-[13px] leading-relaxed text-fog-400">
          {state.report
            ? stale
              ? "The conversation has moved on since this report. Regenerate to include it."
              : "Built from your conversation, uploaded documents and the knowledge base."
            : "Builds a structured report from the conversation, your uploads and the knowledge base."}
        </p>
        <button
          type="button"
          onClick={() => state.generateReport(language)}
          disabled={!canGenerate || running}
          className="shrink-0 rounded-full bg-volt-400 px-5 py-2 text-sm font-medium text-ink-900 transition-all enabled:hover:bg-volt-300 disabled:bg-white/10 disabled:text-fog-500"
        >
          {running ? "Generating…" : state.report ? "Regenerate report" : "Generate investigation report"}
        </button>
      </div>
      {state.reportState.kind === "error" && (
        <p className="mx-5 mt-4 rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2 text-[13px] text-red-200 sm:mx-7">{state.reportState.message}</p>
      )}
      {running && !state.report && (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center" role="status">
          <div className="relative size-12">
            <span className="absolute inset-0 rounded-full border border-volt-400/20" />
            <span className="absolute inset-0 animate-spin rounded-full border-t border-volt-400 motion-reduce:animate-none" />
          </div>
          <p className="text-fog-300">
            <EncryptedText text="Retrieving evidence and building the report" revealDelayMs={30} />
          </p>
        </div>
      )}
      {state.report ? (
        <div className={running ? "opacity-50 transition-opacity" : ""}>
          <Report result={state.report} />
        </div>
      ) : (
        !running && (
          <div className="flex min-h-[360px] items-center justify-center px-6 text-center">
            <p className="max-w-sm text-sm leading-relaxed text-fog-500">
              {canGenerate ? "Ready when you are. The report lists verified findings, possible causes, checks and every source." : "Chat about the fault or upload a document first."}
            </p>
          </div>
        )
      )}
    </div>
  );
}

export function Workspace() {
  const { state: health, refresh } = useHealth();
  const c = useCase();
  const [tab, setTab] = useState<"chat" | "visual" | "health" | "battery" | "report">("chat");
  // The reply language follows the user's own messages.
  const language = "auto";
  const agentFocus = useUi((s) => s.agentFocus);
  const ready = health.kind === "online" && health.health.ready;
  const canUpload = health.kind === "online" && health.health.services.database === "ready" && health.health.services.embeddings === "ready";
  const suggestions = health.kind === "online" ? (health.health.knowledgeBase.vehicles ?? []) : [];

  // Parts the latest answer's evidence points at, plus module numbers named in the chat.
  const lastAssistant = [...c.messages].reverse().find((m) => m.role === "assistant");
  const lastUser = [...c.messages].reverse().find((m) => m.role === "user");
  const mapSources = c.turn?.sources.length ? c.turn.sources : (lastAssistant?.sources?.length ? lastAssistant.sources : []);
  const hits: Record<string, number> = {};
  for (const s of mapSources) for (const id of s.components) hits[id] = (hits[id] ?? 0) + 1;
  const modules = [
    ...new Set(
      [...`${c.turn?.user ?? lastUser?.content ?? ""} ${lastAssistant?.content ?? ""}`.matchAll(/(?:module|cell group)\s*#?(\d{1,2})/gi)]
        .map((m) => +m[1])
        .filter((n) => n >= 1 && n <= 12),
    ),
  ];

  // Jump to the report once it exists.
  useEffect(() => {
    if (c.report && c.reportState.kind === "idle") setTab("report");
  }, [c.report, c.reportState.kind]);

  return (
    <section id="agent" className="relative min-h-[100svh] bg-ink-900 pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(63,216,242,0.14),transparent_65%)]" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(63,216,242,0.09) 1px,transparent 1px),linear-gradient(90deg,rgba(63,216,242,0.09) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <span className="pointer-events-none absolute inset-x-0 top-32 h-px animate-[scan_6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-volt-400/60 to-transparent motion-reduce:hidden" />
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">
              <EncryptedText text="Diagnosis workspace" revealDelayMs={50} />
            </p>
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-fog-100 sm:text-[2.75rem]">
              Drop the manual. <br className="hidden sm:block" />
              We'll find the <SquigglyText className="cursor-default text-volt-400">fault.</SquigglyText>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-fog-300">
              Upload manuals, scan reports or logs. FixSkrew reads every file, identifies the vehicle for you to confirm, then
              diagnoses with the source cited on every answer.
            </p>
          </div>
          <div id="service-status" className="glass rounded-xl px-4 py-3 lg:max-w-xl">
            <ServiceStatus state={health} onRetry={refresh} />
          </div>
        </div>

        <div className="mt-10">
          <Workflow state={c} />
        </div>

        {c.error && <p className="mt-4 rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2 text-[13px] text-red-200">{c.error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <DocumentsCard
              state={c}
              disabled={!canUpload}
              disabledReason="Uploads need MongoDB Atlas and the embedding model connected."
            />
            <VehicleCard state={c} suggestions={suggestions} />
            {c.data && (
              <div className="flex justify-end px-1">
                <button
                  type="button"
                  onClick={() => window.confirm("Start a new case? This one stays on the server but will no longer open here.") && c.newCase()}
                  className="text-xs text-fog-500 hover:text-fog-100"
                >
                  New case
                </button>
              </div>
            )}
          </div>

          <div className="glass flex flex-col overflow-hidden rounded-2xl">
            <div role="tablist" aria-label="Workspace" className="flex items-center gap-1 border-b border-white/[0.07] px-3 pt-2">
              {(["chat", "visual", "health", "battery", "report"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`relative px-4 py-2.5 text-sm transition-colors ${tab === t ? "text-fog-100" : "text-fog-500 hover:text-fog-300"}`}
                >
                  {t === "chat" ? "Chat" : t === "visual" ? "Visual locator" : t === "health" ? "Battery health" : t === "battery" ? "Battery map" : "Investigation report"}
                  {t === "report" && c.report && <span className="ml-2 inline-block size-1.5 rounded-full bg-volt-400 align-middle" />}
                  {tab === t && <motion.span layoutId="ws-tab" className="absolute inset-x-3 -bottom-px h-px bg-volt-400" />}
                </button>
              ))}
              {c.loading && <span className="ml-auto pr-3 font-mono text-[11px] text-fog-500">Loading case…</span>}
              {tab === "chat" && c.messages.length > 0 && (
                <button
                  type="button"
                  disabled={Boolean(c.turn && !c.turn.error)}
                  onClick={() => window.confirm("Clear this conversation? Uploaded documents are kept, and the investigation report is removed.") && void c.clearChat().catch(() => undefined)}
                  className="ml-auto pr-3 text-xs text-fog-500 transition-colors hover:text-fog-100 disabled:opacity-40"
                >
                  Clear chat
                </button>
              )}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} role="tabpanel">
                {tab === "health" ? (
                  <BatteryDashboard onUpload={() => setTab("chat")} />
                ) : tab === "visual" ? (
                  <VisualLocator state={c} language={language} />
                ) : tab === "battery" ? (
                  <BatteryMap hits={hits} modules={modules} basis={(c.turn?.user ?? lastUser?.content)?.slice(0, 70)} />
                ) : tab === "chat" ? (
                  <ChatPanel
                    state={c}
                    language={language}
                    ready={ready}
                    notReadyReason={notReadyReason(health)}
                    focus={agentFocus}
                    clearFocus={() => setUi({ agentFocus: null })}
                  />
                ) : (
                  <ReportTab state={c} language={language} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
