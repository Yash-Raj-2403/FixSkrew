import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion as fm } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COMPONENTS, PHASES, type PhaseId } from "../data/components";
import { setProgress, setUi, useUi } from "../lib/store";
import { usePrefersReducedMotion } from "../lib/device";
import { scrollToHeroProgress } from "../lib/scroll";
import { openDiagnosis } from "../lib/router";
import { ComponentPanel } from "./ComponentPanel";
import { HeroSequence } from "./HeroSequence";
import { EncryptedText } from "./ui/encrypted-text";
import { SquigglyText } from "./ui/squiggly-text";

gsap.registerPlugin(ScrollTrigger);

const CAPTIONS: Partial<Record<PhaseId, { eyebrow: string; title: string; body: string }>> = {
  body: {
    eyebrow: "02 · Body disassembly",
    title: "Doors, hood and body open up.",
    body: "The closures swing open, then the body shell, interior and panels lift away from the structure beneath.",
  },
  battery: {
    eyebrow: "03 · Battery reveal",
    title: "The pack sits low, between the axles.",
    body: "The floor-mounted battery pack, with its high-voltage cabling, links the front and rear drive units.",
  },
  explore: {
    eyebrow: "04 · Explore components",
    title: "Select any component.",
    body: "Open a component to see what it does, why it matters in diagnosis, and which documents in your knowledge base cover it.",
  },
};

function PhaseRail({ phase }: { phase: PhaseId }) {
  const idx = PHASES.findIndex((p) => p.id === phase);
  return (
    <nav aria-label="Vehicle tour" className="pointer-events-auto absolute top-1/2 right-4 hidden -translate-y-1/2 lg:right-10 lg:block">
      <ol className="relative flex flex-col gap-11">
        <span className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-white/15" aria-hidden />
        <span
          className="absolute top-1.5 left-[5px] w-px bg-volt-400 shadow-[0_0_10px_rgba(63,216,242,0.8)] transition-[height] duration-500"
          style={{ height: `calc(${(idx / (PHASES.length - 1)) * 100}% - 6px)` }}
          aria-hidden
        />
        {PHASES.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => (p.id === "diagnose" ? openDiagnosis() : scrollToHeroProgress(p.anchor))}
              aria-current={p.id === phase ? "step" : undefined}
              className="group relative flex items-center gap-3.5 text-left"
            >
              <span
                className={`relative z-10 size-[11px] rounded-full border transition-all duration-300 ${
                  i <= idx ? "border-volt-400 bg-volt-400 shadow-[0_0_10px_rgba(63,216,242,0.9)]" : "border-white/30 bg-ink-900 group-hover:border-white/60"
                }`}
              />
              <span
                className={`max-w-24 text-[12px] leading-tight transition-colors ${
                  p.id === phase ? "text-fog-100" : "text-fog-500 group-hover:text-fog-300"
                }`}
              >
                {p.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function MobileStepper({ phase }: { phase: PhaseId }) {
  return (
    <div className="pointer-events-auto absolute right-0 bottom-5 left-0 flex justify-center gap-2 lg:hidden">
      {PHASES.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => (p.id === "diagnose" ? openDiagnosis() : scrollToHeroProgress(p.anchor))}
          aria-label={p.label}
          aria-current={p.id === phase ? "step" : undefined}
          className="grid h-8 place-items-center px-1"
        >
          <span className={`block h-1 rounded-full transition-all ${p.id === phase ? "w-7 bg-volt-400" : "w-3 bg-white/25"}`} />
        </button>
      ))}
    </div>
  );
}

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const headline = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(true);
  const phase = useUi((s) => s.phase);
  const selected = useUi((s) => s.selected);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setProgress(self.progress),
      });
      gsap
        .timeline({
          scrollTrigger: { trigger: section.current, start: "top top", end: () => `+=${window.innerHeight * 0.75}`, scrub: true },
        })
        .to(headline.current, { autoAlpha: 0, y: -48, ease: "power1.in" }, 0)
        .to(hint.current, { autoAlpha: 0, y: 12 }, 0);
    }, section);
    return () => ctx.revert();
  }, []);

  // Stop drawing once the hero has scrolled out of view.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Back at the start of the tour, close any open component details.
  useEffect(() => {
    if (phase === "overview" && selected) setUi({ selected: null });
  }, [phase, selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUi({ selected: null });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const caption = CAPTIONS[phase];

  return (
    <section id="home" ref={section} className="relative" style={{ height: "600vh" }} aria-label="FixSkrew vehicle overview">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_55%,rgba(63,216,242,0.05),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-900 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink-900/80 to-transparent" />

        <HeroSequence active={active} reducedMotion={reducedMotion} />

        <div className="pointer-events-none absolute inset-0 mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          {/* Phase 1 headline */}
          <div ref={headline} className="pointer-events-auto absolute top-[17%] max-w-xl pr-4 sm:top-[22%] lg:top-[24%]">
            <p className="eyebrow mb-5">
              <EncryptedText text="AI-powered EV diagnostics" revealDelayMs={45} />
            </p>
            <h1 className="text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.02em] text-fog-100 sm:text-6xl lg:text-[4.1rem]">
              Diagnose Deeper.
              <br />
              Fix{" "}
              <SquigglyText className="cursor-default text-volt-400 drop-shadow-[0_0_28px_rgba(63,216,242,0.35)]">Smarter.</SquigglyText>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-fog-300 sm:text-base">
              An AI-powered assistant for EV battery diagnostics. Investigate vehicle issues, explore internal components, and get
              evidence-based guidance in one place.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <button
                type="button"
                onClick={openDiagnosis}
                className="group rounded-full bg-volt-400 px-7 py-3.5 text-[15px] font-medium text-ink-900 shadow-[0_0_32px_rgba(63,216,242,0.35)] transition-all hover:bg-volt-300 hover:shadow-[0_0_44px_rgba(63,216,242,0.55)]"
              >
                Start a Diagnosis <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToHeroProgress(0.3)}
                className="group text-[15px] text-fog-300 transition-colors hover:text-fog-100"
              >
                Explore the vehicle <span className="inline-block transition-transform group-hover:translate-y-0.5">↓</span>
              </button>
            </div>
          </div>

          {/* Scroll hint */}
          <div ref={hint} className="absolute bottom-10 hidden items-center gap-4 text-fog-500 sm:flex">
            <span className="relative block h-9 w-6 rounded-full border border-white/25" aria-hidden>
              <span className="absolute top-2 left-1/2 h-2 w-0.5 -translate-x-1/2 animate-bounce rounded-full bg-fog-300 motion-reduce:animate-none" />
            </span>
            <span className="text-[13px] leading-snug">
              Scroll to explore
              <br />
              inside an electric vehicle
            </span>
          </div>

          {/* Phase captions */}
          <AnimatePresence mode="wait">
            {caption && !selected && (
              <fm.div
                key={phase}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-28 max-w-sm lg:top-auto lg:bottom-16"
              >
                <p className="eyebrow mb-3 text-volt-400!">
                  <EncryptedText text={caption.eyebrow} encryptedClassName="text-volt-600" />
                </p>
                <h2 className="text-2xl leading-tight font-semibold text-fog-100 sm:text-[1.75rem]">{caption.title}</h2>
                <p className="mt-3 hidden text-[14px] leading-relaxed text-fog-300 sm:block">{caption.body}</p>
              </fm.div>
            )}
          </AnimatePresence>

          {/* Component chips during exploration */}
          <AnimatePresence>
            {phase === "explore" && !selected && (
              <fm.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-auto absolute right-4 bottom-16 left-4 lg:right-auto lg:bottom-auto lg:left-12 lg:top-[30%] lg:max-w-sm"
              >
                <p className="eyebrow mb-2 hidden text-[10px]! lg:block">Components</p>
                <ul className="flex flex-wrap gap-1.5">
                  {COMPONENTS.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setUi({ selected: c.id })}
                        className="glass rounded-full px-3 py-1.5 text-[12px] text-fog-300 transition-colors hover:border-volt-400/50 hover:text-fog-100"
                      >
                        {c.short}
                      </button>
                    </li>
                  ))}
                </ul>
              </fm.div>
            )}
          </AnimatePresence>

          {/* Final hand-off */}
          <AnimatePresence>
            {phase === "diagnose" && (
              <fm.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto absolute inset-x-4 bottom-[9%] mx-auto max-w-lg text-center lg:bottom-[6%]"
              >
                <p className="eyebrow mb-3 text-volt-400!">
                  <EncryptedText text="05 · Start diagnosing" encryptedClassName="text-volt-600" />
                </p>
                <h2 className="text-3xl leading-tight font-semibold text-fog-100 sm:text-4xl">From the pack to the evidence.</h2>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-fog-300">
                  Describe the fault. FixSkrew retrieves the relevant documentation and builds an investigation report you can verify.
                </p>
                <button
                  type="button"
                  onClick={openDiagnosis}
                  className="mt-6 rounded-full bg-volt-400 px-7 py-3 text-[15px] font-medium text-ink-900 shadow-[0_0_32px_rgba(63,216,242,0.35)] transition-all hover:bg-volt-300"
                >
                  Start a diagnosis →
                </button>
              </fm.div>
            )}
          </AnimatePresence>

          {/* Selected component */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 max-h-[62svh] sm:inset-x-auto sm:top-28 sm:bottom-10 sm:left-8 sm:max-h-none sm:w-[380px] lg:left-12">
            <ComponentPanel className="h-auto sm:max-h-full" />
          </div>

          <PhaseRail phase={phase} />
          {!selected && <MobileStepper phase={phase} />}
        </div>
      </div>
    </section>
  );
}
