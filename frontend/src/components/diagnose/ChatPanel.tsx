import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COMPONENT_BY_ID, type ComponentId } from "../../data/components";
import { DOC_TYPE_LABEL, type ChatMessage, type Source } from "../../lib/api";
import type { CaseState } from "../../lib/useCase";
import { setUi } from "../../lib/store";
import { RichText } from "./RichText";
import { EncryptedText } from "../ui/encrypted-text";

function SourcesList({ sources, anchorPrefix }: { sources: Source[]; anchorPrefix: string }) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;
  return (
    <div className="mt-3 border-t border-white/[0.06] pt-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-[11px] text-fog-400 hover:text-fog-100" aria-expanded={open}>
        {open ? "Hide" : "Show"} {sources.length} source{sources.length === 1 ? "" : "s"}
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {sources.map((s) => (
            <li key={s.chunkId} id={`${anchorPrefix}-${s.id}`} className="scroll-mt-32 text-[12px] leading-snug">
              <span className="mr-1.5 rounded bg-volt-400/10 px-1.5 py-px font-mono text-[10px] text-volt-300">{s.id}</span>
              <span className="text-fog-100">{s.sourceTitle}</span>
              <span className="text-fog-500">
                {" · "}
                {[s.origin === "case" ? "your upload" : (DOC_TYPE_LABEL[s.docType] ?? s.docType), s.page != null && `p. ${s.page}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Bubble({ m, index }: { m: Pick<ChatMessage, "role" | "content" | "sources">; index: number | string }) {
  const prefix = `msg${index}`;
  if (m.role === "user")
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-volt-400/[0.12] px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap text-fog-100">
          {m.content}
        </div>
      </div>
    );
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-volt-400/30 bg-ink-850" aria-hidden>
        <svg viewBox="0 0 32 32" className="size-4">
          <path d="M16 3.5 26.8 9.75v12.5L16 28.5 5.2 22.25V9.75z" fill="none" stroke="#3fd8f2" strokeWidth="2.6" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-fog-300">
        <RichText text={m.content} sources={m.sources} anchorPrefix={prefix} />
        <SourcesList sources={m.sources ?? []} anchorPrefix={prefix} />
      </div>
    </div>
  );
}

const STARTERS_WITH_DOCS = [
  "Summarise what my uploaded documents say about this fault.",
  "Which trouble codes appear in my documents, and what do the sources say about them?",
  "What should I check first, and what information is still missing?",
];

export function ChatPanel({
  state,
  language,
  ready,
  notReadyReason,
  focus,
  clearFocus,
}: {
  state: CaseState;
  language: string;
  ready: boolean;
  notReadyReason: string;
  focus: ComponentId | null;
  clearFocus: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const { messages, turn } = state;
  const busy = Boolean(turn && !turn.error);
  const hasDocs = (state.data?.documents.length ?? 0) > 0;

  // Keep the newest content in view unless the user scrolled up to read.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, turn?.reply, turn?.error]);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [draft]);

  const submit = (text = draft) => {
    const t = text.trim();
    if (!t || busy || !ready) return;
    const message = focus ? `[About the ${COMPONENT_BY_ID[focus].name}] ${t}` : t;
    stick.current = true;
    setDraft("");
    clearFocus();
    void state.send(message, language);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-[min(74svh,760px)] min-h-[480px] flex-col">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7"
        aria-live="polite"
      >
        {messages.length === 0 && !turn && (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <p className="text-fog-100">{ready ? "Describe the fault, or ask about your documents." : notReadyReason}</p>
            {ready && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-fog-500">
                Say what the vehicle does, when it happens, any warning messages and recent repairs. Answers cite your uploads and the
                knowledge base.
              </p>
            )}
            {ready && hasDocs && (
              <div className="mt-6 flex max-w-lg flex-col gap-2">
                {STARTERS_WITH_DOCS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-left text-[13px] text-fog-300 transition-colors hover:border-volt-400/40 hover:text-fog-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={m.id} m={m} index={i} />
        ))}

        {turn && (
          <>
            <Bubble m={{ role: "user", content: turn.user }} index="pending-user" />
            <div className="flex gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-volt-400/30 bg-ink-850" aria-hidden>
                <span className="size-1.5 animate-pulse rounded-full bg-volt-400 motion-reduce:animate-none" />
              </span>
              <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-fog-300">
                {turn.reply ? (
                  <RichText text={turn.reply} sources={turn.sources} anchorPrefix="pending" />
                ) : !turn.error ? (
                  <p className="text-fog-500">
                    <EncryptedText
                      text={turn.sources.length ? `Found ${turn.sources.length} relevant passages · analysing` : "Searching your documents and the knowledge base"}
                      revealDelayMs={25}
                      replayKey={turn.sources.length}
                    />
                  </p>
                ) : null}
                {turn.error && (
                  <div className="mt-2 rounded-lg border border-red-400/25 bg-red-400/[0.06] px-3 py-2 text-[13px] text-red-200">
                    {turn.error}
                    <div className="mt-1.5 flex gap-4 text-[12px]">
                      <button type="button" onClick={() => state.send(turn.user, language)} className="text-volt-400 hover:text-volt-300">
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(turn.user);
                          state.dismissTurn();
                        }}
                        className="text-fog-400 hover:text-fog-100"
                      >
                        Edit message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-white/[0.07] p-3 sm:p-4">
        <AnimatePresence>
          {focus && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-2 flex">
              <span className="flex items-center gap-1.5 rounded-full border border-volt-400/40 bg-volt-400/[0.08] py-0.5 pr-1 pl-2.5 text-[11px] text-volt-300">
                Asking about: {COMPONENT_BY_ID[focus].name}
                <button type="button" onClick={clearFocus} className="grid size-4 place-items-center rounded-full hover:bg-volt-400/20" aria-label="Remove component focus">
                  ×
                </button>
              </span>
              <button type="button" onClick={() => setUi({ selected: focus })} className="sr-only">
                Show component details
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 pl-4 transition-colors focus-within:border-volt-500">
          <label htmlFor="symptoms" className="sr-only">
            Message
          </label>
          <textarea
            id="symptoms"
            ref={textarea}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            disabled={!ready}
            maxLength={4000}
            placeholder={ready ? "Describe the fault or ask a question… (Enter to send, Shift+Enter for a new line)" : notReadyReason}
            className="max-h-44 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-[14px] leading-relaxed text-fog-100 outline-none placeholder:text-fog-500 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => submit()}
            disabled={!ready || busy || !draft.trim()}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-volt-400 text-ink-900 transition-all enabled:hover:bg-volt-300 disabled:bg-white/10 disabled:text-fog-500"
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
