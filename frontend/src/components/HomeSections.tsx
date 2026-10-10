import { motion } from "framer-motion";
import { openDiagnosis, goToAbout } from "../lib/router";
import { EncryptedText } from "./ui/encrypted-text";
import { SquigglyText } from "./ui/squiggly-text";
import { MaskContainer } from "./ui/svg-mask-effect";

const STEPS = [
  {
    title: "Describe the fault",
    body: "Vehicle make and model, the symptoms in your own words, any trouble codes and the measurements you have taken.",
    icon: <path d="M4 5h11l5 5v9H4zM15 5v5h5M8 14h8M8 17h5" />,
  },
  {
    title: "Evidence is retrieved",
    body: "Service manuals, bulletins, recalls, logs and repair histories are searched for passages that match this vehicle and fault.",
    icon: <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" />,
  },
  {
    title: "The evidence is analysed",
    body: "Possible causes are weighed against what the sources actually say. Anything a source does not support is left out.",
    icon: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
  },
  {
    title: "You get a report",
    body: "Verified findings, possible causes, ordered checks and the missing information, with every claim linked to its source.",
    icon: <path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h3" />,
  },
];

const REPORT_PARTS = [
  { title: "Verified findings", note: "Only what your data and a source both confirm.", tone: "border-emerald-400/30 text-emerald-300", bars: [92, 64] },
  { title: "Possible causes", note: "Clearly labelled as unverified, each with its reasoning.", tone: "border-white/15 text-fog-300", bars: [88, 72, 54] },
  { title: "Recommended checks", note: "Ordered steps, with high-voltage work flagged.", tone: "border-amber-hv/30 text-amber-hv", bars: [80, 70, 60, 46] },
  { title: "Sources", note: "Document title, page and excerpt for every citation.", tone: "border-volt-400/30 text-volt-300", bars: [76, 76, 76] },
];

function Eyebrow({ text }: { text: string }) {
  return (
    <p className="eyebrow mb-4">
      <EncryptedText text={text} revealDelayMs={45} />
    </p>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20 border-t border-white/[0.06] bg-ink-900 py-24 sm:py-28">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow text="How a diagnosis works" />
            <h2 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-fog-100 sm:text-[2.6rem]">
              From symptom to evidence in four steps.
            </h2>
          </div>
          <button type="button" onClick={openDiagnosis} className="text-sm text-volt-400 transition-colors hover:text-volt-300">
            Start a diagnosis →
          </button>
        </div>

        <ol className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          <span className="absolute top-6 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-volt-400/0 via-volt-400/40 to-volt-400/0 lg:block" aria-hidden />
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative lg:px-6"
            >
              <span className="relative z-10 grid size-12 place-items-center rounded-2xl border border-volt-400/30 bg-ink-850 text-volt-400 shadow-[0_0_24px_rgba(63,216,242,0.15)]">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {s.icon}
                </svg>
              </span>
              <p className="mt-5 font-mono text-[11px] text-fog-500">0{i + 1}</p>
              <h3 className="mt-1 text-[17px] font-medium text-fog-100">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog-400">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function EvidenceReveal() {
  return (
    <section className="bg-ink-900 pb-24 sm:pb-28">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <MaskContainer
          className="h-[22rem] rounded-2xl border border-white/[0.07] sm:h-[26rem]"
          revealText={
            <p className="mx-auto max-w-3xl px-6 text-center text-3xl leading-tight font-semibold text-fog-300 sm:text-5xl">
              A warning light tells you something is wrong.
            </p>
          }
        >
          <p className="text-3xl leading-tight font-semibold text-ink-900 sm:text-5xl">
            The documented evidence tells you <span className="underline decoration-4 underline-offset-8">why</span>.
          </p>
        </MaskContainer>
        <p className="mt-3 text-center text-xs text-fog-500">
          <span className="hidden [@media(pointer:fine)]:inline">Move your cursor over the panel.</span>
          <span className="[@media(pointer:fine)]:hidden">Tap the panel.</span>
        </p>
      </div>
    </section>
  );
}

function ReportAnatomy() {
  return (
    <section id="report" className="scroll-mt-20 border-t border-white/[0.06] bg-ink-950 py-24 sm:py-28">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
        <div>
          <Eyebrow text="What you get" />
          <h2 className="max-w-md text-3xl leading-tight font-semibold tracking-tight text-fog-100 sm:text-[2.6rem]">
            A report you can check line by line.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fog-300">
            Every investigation follows the same structure, so you always know what is confirmed, what is a lead, and where each statement
            came from. When the knowledge base has nothing relevant, the report says so instead of guessing.
          </p>
          <button type="button" onClick={() => goToAbout("principles")} className="mt-6 text-sm text-volt-400 transition-colors hover:text-volt-300">
            Read the principles behind it →
          </button>
        </div>

        <div className="glass rounded-2xl p-5 sm:p-7" aria-label="Report structure (illustration)">
          <p className="mb-5 font-mono text-[10.5px] tracking-widest text-fog-500 uppercase">Report structure · illustration</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {REPORT_PARTS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className={`rounded-xl border bg-white/[0.02] p-4 ${p.tone.split(" ")[0]}`}
              >
                <p className={`text-sm font-medium ${p.tone.split(" ")[1]}`}>{p.title}</p>
                <div className="mt-3 space-y-1.5" aria-hidden>
                  {p.bars.map((w, j) => (
                    <span key={j} className="block h-1.5 rounded-full bg-white/[0.08]" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-fog-400">{p.note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-ink-900 py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(63,216,242,0.12),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl leading-tight font-semibold tracking-tight text-fog-100 sm:text-5xl">
          Start with the{" "}
          <SquigglyText className="cursor-default text-volt-400">symptoms</SquigglyText>.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-fog-300">
          Any make, any model, in your own language. FixSkrew finds the evidence and shows you where every answer comes from.
        </p>
        <button
          type="button"
          onClick={openDiagnosis}
          className="mt-9 rounded-full bg-volt-400 px-8 py-3.5 text-[15px] font-medium text-ink-900 shadow-[0_0_32px_rgba(63,216,242,0.35)] transition-all hover:bg-volt-300 hover:shadow-[0_0_44px_rgba(63,216,242,0.55)]"
        >
          Start a Diagnosis →
        </button>
      </div>
    </section>
  );
}

/** Sections below the hero on the home page. */
export function HomeSections() {
  return (
    <>
      <HowItWorks />
      <EvidenceReveal />
      <ReportAnatomy />
      <ClosingCta />
    </>
  );
}
