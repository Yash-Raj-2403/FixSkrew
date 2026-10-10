import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as fm } from "framer-motion";
import { motion } from "../lib/store";

/**
 * Hero vehicle: a rendered whole-vehicle-to-exploded-view sequence (120 frames in
 * public/media/sequence, plus a 640 px set in /mobile for small screens) played under scroll
 * control. The card travels across the hero as the tour advances and zooms toward the battery
 * pack. It is a rendered illustration, not an interactive 3D model.
 */
const FRAMES = 120;
const NAV = 80;
const BASE_W = 1280; // the card is laid out at this size and scaled with a transform
const BASE_H = 720;

const base = "/media/sequence";
const isSmall = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
const frameUrl = (i: number, small: boolean) => `${base}${small ? "/mobile" : ""}/frame_${String(i + 1).padStart(4, "0")}.webp`;

/**
 * Monotone cubic (PCHIP) curve through control points. Unlike easing each segment, it never
 * stops dead at a key and never overshoots, so a continuous scroll feels like one motion.
 */
function curve(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  const m: number[] = new Array(n).fill(0);
  const end = (h0: number, h1: number, d0: number, d1: number) => {
    let v = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
    if (Math.sign(v) !== Math.sign(d0)) v = 0;
    else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(v) > 3 * Math.abs(d0)) v = 3 * d0;
    return v;
  };
  if (n === 2) {
    m[0] = m[1] = d[0];
  } else {
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] > 0) {
        const w1 = 2 * h[i] + h[i - 1];
        const w2 = h[i] + 2 * h[i - 1];
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    m[0] = end(h[0], h[1], d[0], d[1]);
    m[n - 1] = end(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}

/**
 * Hero scroll progress -> frame position. The footage opens slowly, separates quickly through
 * the middle and settles around frame 110; the whole move plays out by the middle of the hero.
 */
const framePosition = curve([0, 0.1, 0.5, 1], [0, 9, 100, FRAMES - 1]);

/** Zoom toward the battery pack (centre of the exploded view, a little below the middle). */
const zoomAt = curve([0, 0.42, 0.6, 0.66, 0.76, 0.86, 0.97], [1, 1, 1.55, 1.55, 1.12, 1.12, 1.5]);
const FOCUS = { u: -0.02, v: 0.15 }; // battery centre, as an offset from the frame centre (fraction of frame size)

interface Geo {
  cx: number;
  cy: number;
  w: number;
}

/** Where the card sits at each point of the tour, for the current container size. */
function layout(cw: number, ch: number): { p: number; g: Geo }[] {
  const wide = cw >= 1280;
  const pad = cw < 640 ? 16 : 32;
  const top = NAV + 14;
  const availH = ch - top - (wide ? 28 : 56);
  const byHeight = (availH * 16) / 9;

  if (wide) {
    const left = Math.max(48, (cw - 1440) / 2 + 48);
    const railX = cw - 216; // keep the card clear of the phase rail on the right
    const over = { x0: left + 540, x1: railX };
    // Body, battery and explore phases keep a clear column on the left for captions and the
    // component panel, so text never sits on top of the image.
    const mid = { x0: left + 340, x1: railX };
    const big = Math.min(cw - 380, byHeight);
    const cy = top + availH / 2;
    const region = (r: { x0: number; x1: number }, maxW: number): Geo => {
      const w = Math.min(r.x1 - r.x0, maxW);
      return { cx: r.x0 + (r.x1 - r.x0) / 2, cy, w };
    };
    return [
      { p: 0, g: region(over, byHeight * 0.92) },
      { p: 0.15, g: region(mid, byHeight * 1.0) },
      { p: 0.86, g: region(mid, byHeight * 1.0) },
      { p: 0.97, g: { cx: cw / 2, cy: top + (big * 0.6 * 9) / 32 + 6, w: big * 0.6 } },
    ];
  }

  const w = Math.min(cw - 2 * pad, byHeight);
  const h = (w * 9) / 16;
  // Phase captions occupy the top of the screen on small devices; the card sits below them.
  const capTop = cw < 640 ? 204 : 300;
  const mid = capTop + (ch - 56 - capTop) / 2;
  return [
    { p: 0, g: { cx: cw / 2, cy: ch - 64 - h / 2, w } },
    { p: 0.15, g: { cx: cw / 2, cy: mid, w } },
    { p: 0.62, g: { cx: cw / 2, cy: mid, w } },
    { p: 0.76, g: { cx: cw / 2, cy: capTop + h / 2, w } },
    { p: 0.86, g: { cx: cw / 2, cy: capTop + h / 2, w } },
    { p: 0.97, g: { cx: cw / 2, cy: top + (w * 0.8 * 9) / 32 + 4, w: w * 0.8 } },
  ];
}

/** Smooth curves for the card's centre and width, rebuilt only when the viewport changes. */
function geometryCurves(cw: number, ch: number) {
  const keys = layout(cw, ch);
  const xs = keys.map((k) => k.p);
  return {
    cx: curve(xs, keys.map((k) => k.g.cx)),
    cy: curve(xs, keys.map((k) => k.g.cy)),
    w: curve(xs, keys.map((k) => k.g.w)),
  };
}

/** Loads frames coarse-to-fine so scrubbing works almost immediately. */
function useFrames(small: boolean) {
  const images = useRef<(HTMLImageElement | null)[]>(Array(FRAMES).fill(null));
  const [count, setCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const order: number[] = [];
    const seen = new Set<number>();
    for (const stride of [16, 8, 4, 2, 1])
      for (let i = 0; i < FRAMES; i += stride) if (!seen.has(i)) (seen.add(i), order.push(i));
    if (!seen.has(FRAMES - 1)) order.splice(3, 0, FRAMES - 1);

    let cancelled = false;
    let next = 0;
    let errors = 0;
    const worker = async () => {
      while (!cancelled && next < order.length) {
        const i = order[next++];
        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(i, small);
        try {
          await img.decode();
          images.current[i] = img;
          if (!cancelled) setCount((c) => c + 1);
        } catch {
          if (++errors > 6 && !cancelled) setFailed(true);
        }
      }
    };
    void Promise.all(Array.from({ length: 6 }, worker));
    return () => {
      cancelled = true;
    };
  }, [small]);

  return { images, count, failed };
}

const STAGE_LABEL = { assembled: "Assembled vehicle", opening: "Doors and hood opening", separating: "Body separating", exploded: "Exploded view" } as const;
type Stage = keyof typeof STAGE_LABEL;

function stageAt(pos: number): Stage {
  return pos < 12 ? "assembled" : pos < 38 ? "opening" : pos < 86 ? "separating" : "exploded";
}

export function HeroSequence({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const holder = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const badgeTL = useRef<HTMLDivElement>(null);
  const badgeBR = useRef<HTMLDivElement>(null);
  const size = useRef({ cw: 1280, ch: 800 });
  const curves = useRef<{ key: string; c: ReturnType<typeof geometryCurves> } | null>(null);
  const drawn = useRef("");
  const stage1 = useRef(motion.current); // first smoothing stage
  const [small] = useState(isSmall);
  const { images, count, failed } = useFrames(small);
  const [stage, setStage] = useState<Stage>("assembled");

  // Track the hero's sticky viewport size.
  useEffect(() => {
    const el = holder.current?.parentElement;
    if (!el) return;
    const read = () => (size.current = { cw: el.clientWidth, ch: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();

    /** Nearest loaded frame at or below / at or above index i (or -1). */
    const bracket = (i: number): [number, number] => {
      const imgs = images.current;
      let lo = Math.min(i, FRAMES - 1);
      while (lo >= 0 && !imgs[lo]) lo--;
      let hi = Math.max(i, 0);
      while (hi < FRAMES && !imgs[hi]) hi++;
      return [lo, hi < FRAMES ? hi : -1];
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      // Two cascaded smoothing stages: motion eases in and out instead of starting and stopping
      // abruptly, and a flick of the wheel does not make the car jump.
      if (reducedMotion) {
        stage1.current = motion.current = motion.target;
      } else {
        const k = 1 - Math.exp(-dt * 7);
        stage1.current += (motion.target - stage1.current) * k;
        motion.current += (stage1.current - motion.current) * k;
        if (Math.abs(motion.target - motion.current) < 0.0003) stage1.current = motion.current = motion.target;
      }
      const p = motion.current;

      // Cross-fade the two nearest loaded frames (the frames are opaque).
      const pos = framePosition(p);
      const sig = `${Math.round(pos * 20)}:${count}`;
      if (sig !== drawn.current) {
        drawn.current = sig;
        const lo = bracket(Math.floor(pos))[0]; // nearest loaded frame at or below
        const hi = bracket(Math.ceil(pos))[1]; // nearest loaded frame at or above
        const a = lo >= 0 ? lo : hi;
        const b = hi >= 0 ? hi : lo;
        if (a >= 0 && b >= 0) {
          const f = a === b ? 0 : Math.min(1, Math.max(0, (pos - a) / (b - a)));
          const cw = canvas.current!.width;
          const ch = canvas.current!.height;
          ctx.globalAlpha = 1;
          ctx.drawImage(images.current[a]!, 0, 0, cw, ch);
          if (f > 0.01) {
            ctx.globalAlpha = f;
            ctx.drawImage(images.current[b]!, 0, 0, cw, ch);
            ctx.globalAlpha = 1;
          }
        }
      }

      // Card position and size: transform only, so the browser moves a ready-made layer on the
      // GPU instead of re-laying-out and repainting it every frame.
      const { cw, ch } = size.current;
      const key = `${cw}x${ch}`;
      if (curves.current?.key !== key) curves.current = { key, c: geometryCurves(cw, ch) };
      const g = curves.current.c;
      const w = g.w(p);
      const scale = w / BASE_W;
      const left = g.cx(p) - w / 2;
      const top = g.cy(p) - (w * 9) / 32;
      const el = card.current;
      if (el) el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${scale})`;
      // Badges stay a constant size and pinned to the card's corners.
      if (badgeTL.current) badgeTL.current.style.transform = `translate3d(${left + 12}px, ${top + 12}px, 0)`;
      if (badgeBR.current) badgeBR.current.style.transform = `translate3d(${left + w - 12}px, ${top + (w * 9) / 16 - 12}px, 0) translate(-100%, -100%)`;

      // Zoom toward the battery pack, keeping the frame edge inside the card.
      const s = zoomAt(p);
      const lim = (s - 1) / 2;
      const tx = Math.max(-lim, Math.min(lim, -s * FOCUS.u));
      const ty = Math.max(-lim, Math.min(lim, -s * FOCUS.v));
      if (inner.current) inner.current.style.transform = `translate3d(${tx * 100}%, ${ty * 100}%, 0) scale(${s})`;

      const st = stageAt(pos);
      setStage((prev) => (prev === st ? prev : st));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reducedMotion, count, images]);

  const loading = count < FRAMES && !failed;
  return (
    <div ref={holder} className="pointer-events-none absolute inset-0">
      <div
        ref={card}
        className="absolute top-0 left-0 origin-top-left will-change-transform"
        style={{ width: BASE_W, height: BASE_H, transform: "translate3d(40vw, 24vh, 0) scale(0.5)" }}
      >
        {/* Frame edges fade into the page so the studio backdrop never shows as a rectangle */}
        <div className="absolute inset-0 overflow-hidden [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_9%,#000_91%,transparent),linear-gradient(to_bottom,transparent,#000_8%,#000_90%,transparent)] [-webkit-mask-composite:source-in]">
          <div ref={inner} className="absolute inset-0 origin-center will-change-transform">
            {/* First frame shows immediately while the sequence streams in */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${base}/first.jpg)` }} aria-hidden />
            <canvas
              ref={canvas}
              width={small ? 640 : 1280}
              height={small ? 360 : 720}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={`Vehicle illustration: ${STAGE_LABEL[stage]}`}
            />
          </div>
        </div>
      </div>

      <div ref={badgeTL} className="absolute top-0 left-0">
        <AnimatePresence mode="wait">
          <fm.span
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/70 px-3 py-1.5 text-[11px] font-medium text-fog-100 backdrop-blur-md sm:text-xs"
          >
            <span className="size-1.5 rounded-full bg-volt-400 shadow-[0_0_8px_rgba(63,216,242,0.9)]" />
            {STAGE_LABEL[stage]}
          </fm.span>
        </AnimatePresence>
      </div>

      <div ref={badgeBR} className="absolute top-0 left-0">
        {loading && (
          <span className="rounded-full bg-ink-900/80 px-2.5 py-1 font-mono text-[10px] text-fog-400 backdrop-blur-md" role="status">
            Loading frames {Math.round((count / FRAMES) * 100)}%
          </span>
        )}
        {failed && (
          <p className="rounded-lg bg-ink-900/85 px-3 py-2 text-center text-xs text-fog-300" role="alert">
            The vehicle frames could not be loaded.
          </p>
        )}
      </div>
    </div>
  );
}
