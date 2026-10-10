// Adapted from Aceternity UI "Navbar Menu" (ui.aceternity.com/components/navbar-menu).
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

const transition = { type: "spring" as const, mass: 0.5, damping: 11.5, stiffness: 100, restDelta: 0.001, restSpeed: 0.001 };

export function Menu({ setActive, children, className }: { setActive: (item: string | null) => void; children: ReactNode; className?: string }) {
  return (
    <div
      onMouseLeave={() => setActive(null)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setActive(null)}
      onKeyDown={(e) => e.key === "Escape" && setActive(null)}
      className={cn("relative flex items-center", className)}
    >
      {children}
    </div>
  );
}

/**
 * A top-level item. `trigger` is the clickable label (a real link/button); the
 * dropdown opens on hover or keyboard focus.
 */
export function MenuItem({
  item,
  active,
  setActive,
  trigger,
  children,
}: {
  item: string;
  active: string | null;
  setActive: (item: string) => void;
  trigger: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div onMouseEnter={() => setActive(item)} onFocus={() => setActive(item)} className="relative">
      {trigger}
      {active !== null && (
        <motion.div initial={{ opacity: 0, scale: 0.85, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={transition}>
          {active === item && children && (
            <div className="absolute top-[calc(100%_+_0.4rem)] left-1/2 -translate-x-1/2 pt-3">
              <motion.div
                transition={transition}
                layoutId="nav-dropdown"
                className="overflow-hidden rounded-2xl border border-white/[0.12] bg-ink-850/90 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              >
                <motion.div layout className="h-full w-max p-4">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function ProductItem({ title, description, onSelect, icon }: { title: string; description: string; onSelect: () => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-64 items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.05]"
    >
      {icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink-800 text-volt-400 transition-colors group-hover:border-volt-400/40">
          {icon}
        </span>
      )}
      <span>
        <span className="block text-sm font-medium text-fog-100">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-fog-400">{description}</span>
      </span>
    </button>
  );
}

export function HoveredLink({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="block text-left text-sm text-fog-400 transition-colors hover:text-fog-100 focus-visible:text-fog-100">
      {children}
    </button>
  );
}
