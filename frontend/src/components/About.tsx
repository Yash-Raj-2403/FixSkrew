import { motion } from "framer-motion";
import { EncryptedText } from "./ui/encrypted-text";
import { SquigglyText } from "./ui/squiggly-text";
import { LinkPreview } from "./ui/link-preview";
import { openDiagnosis } from "../lib/router";

const linkClass = "text-fog-100 underline decoration-volt-400/50 underline-offset-4 transition-colors hover:text-volt-300 hover:decoration-volt-300";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.2 } as const;

function RagDiagram() {
  return (
    <svg viewBox="0 0 200 90" className="h-20 w-full text-fog-500" aria-hidden>
      <rect x="6" y="34" width="34" height="22" rx="4" {...stroke} />
      <path d="M13 42h20M13 48h14" {...stroke} />
      {[14, 38, 62].map((y, i) => (
        <g key={y}>
          <rect x="78" y={y} width="40" height="16" rx="3" {...stroke} className={i === 1 ? "text-volt-400" : ""} />
          <path d={`M40 45 C 58 45, 60 ${y + 8}, 78 ${y + 8}`} {...stroke} strokeDasharray="2 3" />
          <path d={`M118 ${y + 8} C 136 ${y + 8}, 138 45, 156 45`} {...stroke} className={i === 1 ? "text-volt-400" : ""} />
        </g>
      ))}
      <rect x="156" y="30" width="38" height="30" rx="4" {...stroke} className="text-volt-400" />
      <path d="M163 39h24M163 45h18M163 51h21" {...stroke} className="text-volt-400" />
    </svg>
  );
}

function AtlasDiagram() {
  const dots = [
    [30, 22], [48, 60], [62, 30], [80, 70], [92, 18], [104, 48], [120, 64], [134, 26], [150, 52], [168, 34], [176, 70], [40, 44],
  ];
  return (
    <svg viewBox="0 0 200 90" className="h-20 w-full text-fog-500" aria-hidden>
      <rect x="84" y="10" width="74" height="70" rx="6" {...stroke} strokeDasharray="3 3" className="text-volt-400/70" />
      {dots.map(([x, y], i) => {
        const inFilter = x > 84 && x < 158;
        return <circle key={i} cx={x} cy={y} r={inFilter ? 3.2 : 2.4} fill="currentColor" className={inFilter ? "text-volt-400" : ""} opacity={inFilter ? 1 : 0.5} />;
      })}
      <circle cx="118" cy="44" r="16" {...stroke} className="text-volt-300" />
      <path d="M118 40v8M114 44h8" {...stroke} className="text-volt-300" />
    </svg>
  );
}

function MultilingualDiagram() {
  const langs = ["배터리 경고", "Akku-Warnung", "Battery warning", "Alerta batería"];
  return (
    <svg viewBox="0 0 200 90" className="h-20 w-full text-fog-500" aria-hidden>
      {langs.map((l, i) => (
        <g key={l}>
          <text x="6" y={18 + i * 20} fontSize="9" fill="currentColor" fontFamily="Inter, sans-serif">
            {l}
          </text>
          <path d={`M78 ${15 + i * 20} C 120 ${15 + i * 20}, 130 45, 166 45`} {...stroke} strokeDasharray="2 3" />
        </g>
      ))}
      <circle cx="172" cy="45" r="7" fill="currentColor" className="text-volt-400" />
      <circle cx="172" cy="45" r="13" {...stroke} className="text-volt-400/50" />
    </svg>
  );
}

function BatteryDiagram() {
  const layer = (y: number, cls = "") => (
    <polygon points={`40,${y} 150,${y} 170,${y + 12} 60,${y + 12}`} {...stroke} className={cls} />
  );
  return (
    <svg viewBox="0 0 200 90" className="h-20 w-full text-fog-500" aria-hidden>
      {layer(6)}
      {layer(28, "text-volt-400")}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${62 + i * 20} 28 l 20 12`} {...stroke} className="text-volt-400/60" />
      ))}
      {layer(50, "text-volt-300")}
      {layer(72)}
      <path d="M176 34 h18" {...stroke} className="text-volt-400" />
      <circle cx="194" cy="34" r="2.5" fill="currentColor" className="text-volt-400" />
      <path d="M30 56 C 10 56, 10 78, 40 78" {...stroke} className="text-[#ff9a3c]" />
    </svg>
  );
}

const CAPABILITIES = [
  {
    id: "cap-rag",
    title: "Evidence-grounded RAG",
    body: "Every cause and check in a report cites the retrieved passages behind it. Citations that point nowhere are stripped, and unsupported items are removed before you see them.",
    Diagram: RagDiagram,
  },
  {
    id: "cap-atlas",
    title: "MongoDB Atlas knowledge retrieval",
    body: "Service manuals, bulletins, recalls, logs and repair histories are chunked with metadata and searched with Atlas Vector Search, pre-filtered by vehicle make, model and year, with exact DTC matching alongside.",
    Diagram: AtlasDiagram,
  },
  {
    id: "cap-multilingual",
    title: "Multilingual troubleshooting",
    body: "A multilingual embedding model places a symptom described in Korean, German or English near the same documentation. Reports are written in the language you choose or the one you wrote in.",
    Diagram: MultilingualDiagram,
  },
  {
    id: "cap-visual",
    title: "Interactive battery visualization",
    body: "Each component a report mentions opens its function, its diagnostic relevance and the documents that cover it.",
    Diagram: BatteryDiagram,
  },
];

const PRINCIPLES = [
  {
    title: "No fabricated results",
    body: "Every report comes from documents in your knowledge base. FixSkrew never fills gaps with invented trouble-code definitions, specifications, statistics or example diagnoses.",
  },
  {
    title: "Verified is not the same as possible",
    body: "A finding is verified only when your own data matches what a source states. Everything else is a possible cause, labelled as one, with what would confirm or rule it out.",
  },
  {
    title: "Honest when evidence is thin",
    body: "If nothing relevant is retrieved, the report says so, asks for the information that would help, and recommends inspection by a qualified high-voltage technician.",
  },
  {
    title: "Safety first",
    body: "Steps that involve high-voltage work are flagged, and the documented isolation and verification procedure always comes before touching the system.",
  },
];

const STACK = [
  { name: "MongoDB Atlas Vector Search", role: "Knowledge storage, metadata filtering and vector retrieval", url: "https://www.mongodb.com/products/platform/atlas-vector-search" },
  { name: "Voyage AI", role: "Multilingual embeddings for documents and queries", url: "https://www.voyageai.com" },
  { name: "Claude", role: "Structured, citation-checked investigation reports", url: "https://www.anthropic.com/claude" },
];

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="scroll-mt-28">
      <p className="eyebrow mb-4">
        <EncryptedText text={eyebrow} revealDelayMs={45} />
      </p>
      <h2 className="max-w-2xl text-2xl leading-tight font-semibold tracking-tight text-fog-100 sm:text-[2.1rem]">{title}</h2>
    </div>
  );
}

/** Content of the dedicated /about page. */
export function About() {
  return (
    <div className="relative bg-ink-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_30%_0%,rgba(63,216,242,0.08),transparent_65%)]" />

      {/* Intro */}
      <section className="relative mx-auto max-w-[1440px] px-4 pt-32 pb-20 sm:px-8 sm:pt-40 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow mb-4">
              <EncryptedText text="About FixSkrew" revealDelayMs={55} />
            </p>
            <h1 className="max-w-xl text-4xl leading-[1.08] font-semibold tracking-tight text-fog-100 sm:text-[3.2rem]">
              From Vehicle Symptoms to{" "}
              <SquigglyText className="cursor-default text-volt-400">Evidence-Based</SquigglyText> Investigation.
            </h1>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-fog-300 lg:pt-12">
            <p>
              Diagnosing a high-voltage battery fault means piecing together service manuals, technical bulletins, recall notices,
              diagnostic logs and what has already been repaired. FixSkrew brings those sources into one troubleshooting workflow
              for electric vehicles of any make.
            </p>
            <p>
              A technician describes the symptoms in their own language, adds trouble codes and measurements, and receives a structured
              investigation that separates what the evidence verifies from what it only suggests, with every source attached. When the
              knowledge base cannot support an answer, FixSkrew says so and asks for what it needs.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="relative mx-auto max-w-[1440px] scroll-mt-24 px-4 pb-24 sm:px-8 lg:px-12">
        <SectionHeading eyebrow="Capabilities" title="Four parts of one troubleshooting workflow." />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
          {CAPABILITIES.map(({ id, title, body, Diagram }, i) => (
            <motion.article
              key={title}
              id={id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group scroll-mt-28 bg-ink-950 p-6 transition-colors hover:bg-ink-850 sm:p-7"
            >
              <Diagram />
              <p className="mt-6 font-mono text-[10.5px] text-fog-500">0{i + 1}</p>
              <h3 className="mt-1 text-[17px] font-medium text-fog-100">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-fog-400">{body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section id="principles" className="relative border-t border-white/[0.06] py-24">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
          <SectionHeading eyebrow="Principles" title="Built to be trusted on a high-voltage system." />
          <ol className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title}>
                <span className="font-mono text-[11px] text-volt-400">0{i + 1}</span>
                <h3 className="mt-1.5 text-[16px] font-medium text-fog-100">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fog-400">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="relative border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <SectionHeading eyebrow="Technology" title="What runs underneath." />
          <p className="mt-4 max-w-2xl text-sm text-fog-500">Hover a name to preview its site.</p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STACK.map((t) => (
              <li key={t.name} className="glass rounded-2xl p-5 transition-colors hover:border-white/20">
                <LinkPreview url={t.url} target="_blank" mode="screenshot" className={`${linkClass} text-[15px] font-medium`}>
                  {t.name}
                </LinkPreview>
                <p className="mt-2 text-sm leading-relaxed text-fog-400">{t.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/[0.06] py-24">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-6 px-4 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <h2 className="max-w-xl text-2xl leading-tight font-semibold text-fog-100 sm:text-3xl">
            Have a fault to investigate? Start with the symptoms.
          </h2>
          <button
            type="button"
            onClick={openDiagnosis}
            className="rounded-full bg-volt-400 px-7 py-3.5 text-[15px] font-medium text-ink-900 shadow-[0_0_32px_rgba(63,216,242,0.35)] transition-all hover:bg-volt-300"
          >
            Start a Diagnosis →
          </button>
        </div>
      </section>
    </div>
  );
}
