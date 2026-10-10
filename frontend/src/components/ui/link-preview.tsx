// Adapted from Aceternity UI "Link Preview" (ui.aceternity.com/components/link-preview).
import { useState, type MouseEvent, type ReactNode } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "../../lib/cn";

type LinkPreviewProps = {
  children: ReactNode;
  url: string;
  className?: string;
  width?: number;
  height?: number;
  target?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  "aria-label"?: string;
} & (
  /** Public URL: screenshot rendered by microlink.io. Only use for public pages. */
  | { mode: "screenshot" }
  /** Local preview card, nothing leaves the browser (knowledge-base sources). */
  | { mode: "card"; card: ReactNode }
);

function microlink(url: string, width: number, height: number) {
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    meta: "false",
    embed: "screenshot.url",
    colorScheme: "dark",
    "viewport.isMobile": "true",
    "viewport.deviceScaleFactor": "1",
    "viewport.width": String(width * 3),
    "viewport.height": String(height * 3),
  });
  return `https://api.microlink.io/?${params}`;
}

export function LinkPreview(props: LinkPreviewProps) {
  const { children, url, className, width = 220, height = 138, target, onClick } = props;
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const x = useMotionValue(0);
  const translateX = useSpring(x, { stiffness: 100, damping: 15 });

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) / 2);
  };
  const external = target === "_blank";

  return (
    <HoverCard.Root openDelay={60} closeDelay={100} onOpenChange={setOpen}>
      <HoverCard.Trigger
        href={url}
        onMouseMove={onMove}
        onClick={onClick}
        target={target}
        rel={external ? "noreferrer" : undefined}
        aria-label={props["aria-label"]}
        className={className}
      >
        {children}
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side="top" align="center" sideOffset={10} className="z-[70] [transform-origin:var(--radix-hover-card-content-transform-origin)]">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }}
                exit={{ opacity: 0, y: 16, scale: 0.7 }}
                style={{ x: translateX }}
                className="rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              >
                {props.mode === "screenshot" ? (
                  <a
                    href={url}
                    target={target}
                    rel={external ? "noreferrer" : undefined}
                    className="block rounded-xl border border-white/10 bg-ink-800 p-1 transition-colors hover:border-volt-400/40"
                    style={{ fontSize: 0 }}
                  >
                    {imgFailed ? (
                      <span className="grid place-items-center rounded-lg text-xs text-fog-400" style={{ width, height, fontSize: 12 }}>
                        {new URL(url).hostname}
                      </span>
                    ) : (
                      <img
                        src={microlink(url, width, height)}
                        width={width}
                        height={height}
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                        className="rounded-lg bg-ink-700"
                        alt={`Preview of ${new URL(url).hostname}`}
                      />
                    )}
                  </a>
                ) : (
                  <div className={cn("glass max-w-80 rounded-xl p-3.5")}>{props.card}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
