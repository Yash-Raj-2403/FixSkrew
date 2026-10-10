// Adapted from Aceternity UI "Encrypted Text" (ui.aceternity.com/components/encrypted-text).
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "../../lib/cn";
import { usePrefersReducedMotion } from "../../lib/device";

type EncryptedTextProps = {
  text: string;
  className?: string;
  /** ms between revealing each real character. */
  revealDelayMs?: number;
  charset?: string;
  /** ms between gibberish flips for unrevealed characters. */
  flipDelayMs?: number;
  encryptedClassName?: string;
  revealedClassName?: string;
  /** Replay the reveal whenever this value changes (e.g. a phase id). */
  replayKey?: string | number;
};

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";

const randomChar = (charset: string) => charset.charAt(Math.floor(Math.random() * charset.length));
const scramble = (text: string, charset: string) => text.split("").map((c) => (c === " " ? " " : randomChar(charset)));

export function EncryptedText({
  text,
  className,
  revealDelayMs = 35,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName = "text-fog-500",
  revealedClassName,
  replayKey,
}: EncryptedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = usePrefersReducedMotion();
  const [revealCount, setRevealCount] = useState(reduced ? text.length : 0);
  const chars = useRef<string[]>(scramble(text, charset));

  useEffect(() => {
    if (reduced) {
      setRevealCount(text.length);
      return;
    }
    if (!inView) return;
    chars.current = scramble(text, charset);
    const start = performance.now();
    let lastFlip = start;
    let raf = 0;
    setRevealCount(0);
    const tick = (now: number) => {
      const count = Math.min(text.length, Math.floor((now - start) / Math.max(1, revealDelayMs)));
      setRevealCount(count);
      if (count >= text.length) return;
      if (now - lastFlip >= flipDelayMs) {
        for (let i = count; i < text.length; i++) chars.current[i] = text[i] === " " ? " " : randomChar(charset);
        lastFlip = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, revealDelayMs, charset, flipDelayMs, reduced, replayKey]);

  if (!text) return null;
  return (
    <span ref={ref} className={className} aria-label={text} role="text">
      {text.split("").map((char, i) => {
        const revealed = i < revealCount;
        return (
          <span key={i} aria-hidden className={cn(revealed ? revealedClassName : encryptedClassName)}>
            {revealed || char === " " ? char : (chars.current[i] ?? randomChar(charset))}
          </span>
        );
      })}
    </span>
  );
}
