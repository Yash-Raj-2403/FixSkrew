// Adapted from Aceternity UI "Squiggly Text" (ui.aceternity.com/components/squiggly-text).
import { useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useTime, useTransform } from "framer-motion";
import { cn } from "../../lib/cn";
import { usePrefersReducedMotion } from "../../lib/device";

export interface SquigglyTextProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  steps?: number;
  stepDuration?: number;
  scale?: number | [number, number];
  baseFrequency?: number;
  numOctaves?: number;
  as?: "span" | "div";
  /**
   * "hover" (default) wobbles only while pointed at, so headings stay readable;
   * "always" wobbles continuously.
   */
  trigger?: "hover" | "always";
}

export function SquigglyText({
  children,
  steps = 5,
  stepDuration = 80,
  scale = [3, 4],
  baseFrequency = 0.02,
  numOctaves = 3,
  as = "span",
  className,
  style,
  trigger = "hover",
}: SquigglyTextProps) {
  const safeId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState(false);
  const active = !reduced && (trigger === "always" || hover);

  const filters = useMemo(() => Array.from({ length: steps }, (_, i) => `url(#squiggly-${safeId}-${i})`), [steps, safeId]);
  const time = useTime();
  const filter = useTransform(time, (t) => (active ? filters[Math.floor(t / stepDuration) % filters.length] : "none"));
  const scaleAt = (i: number) => (Array.isArray(scale) ? scale[i % scale.length] : scale);
  const Wrapper = as === "div" ? motion.div : motion.span;

  return (
    <Wrapper
      style={{ filter, ...style }}
      className={cn("inline-block", className)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {Array.from({ length: steps }).map((_, i) => (
            <filter id={`squiggly-${safeId}-${i}`} key={i}>
              <feTurbulence baseFrequency={baseFrequency} numOctaves={numOctaves} result="noise" seed={i} />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={scaleAt(i)} />
            </filter>
          ))}
        </defs>
      </svg>
      {children}
    </Wrapper>
  );
}
