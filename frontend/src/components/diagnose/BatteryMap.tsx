import { useEffect, useState } from "react";
import { COMPONENT_BY_ID, type ComponentId } from "../../data/components";
import { showComponentInfo } from "../../lib/router";

/**
 * Schematic top view of a generic EV traction battery. It is a localisation aid, not a
 * model of any specific vehicle: positions and module counts vary by make and model.
 * Parts are lit when the evidence behind the latest answer is tagged with them.
 */

type PartId = Extract<ComponentId, "battery-pack" | "battery-modules" | "bms" | "cooling-plate" | "hv-junction-box" | "hv-harness" | "charging-port">;

const PARTS: { id: PartId; stamp: string }[] = [
  { id: "battery-pack", stamp: "BP-01" },
  { id: "battery-modules", stamp: "M-01…12" },
  { id: "bms", stamp: "BMS-01" },
  { id: "cooling-plate", stamp: "CP-01" },
  { id: "hv-junction-box", stamp: "HVJ-01" },
  { id: "hv-harness", stamp: "HVH-01" },
  { id: "charging-port", stamp: "CI-01" },
];

const MODULES = Array.from({ length: 12 }, (_, i) => ({
  n: i + 1,
  x: 78 + (i % 6) * 62,
  y: i < 6 ? 98 : 178,
}));

export interface BatteryMapProps {
  /** Part id -> number of cited passages tagged with it. */
  hits: Record<string, number>;
  /** Module numbers named in the conversation. */
  modules: number[];
  /** Why the map is lit, e.g. the question it answers. */
  basis?: string;
}

export function BatteryMap({ hits, modules, basis }: BatteryMapProps) {
  const lit = (id: PartId) => (hits[id] ?? 0) > 0 || (id === "battery-modules" && modules.length > 0);
  const litIds = PARTS.filter((p) => lit(p.id)).map((p) => p.id);
  const [selected, setSelected] = useState<PartId>("battery-pack");
  const [hover, setHover] = useState<PartId | null>(null);

  // Jump to the strongest implicated part when a new answer arrives.
  const key = litIds.join();
  useEffect(() => {
    if (!litIds.length) return;
    const top = [...litIds].sort((a, b) => (hits[b] ?? 0) - (hits[a] ?? 0))[0];
    setSelected(top);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = hover ?? selected;
  const c = COMPONENT_BY_ID[active];
  const stamp = PARTS.find((p) => p.id === active)!.stamp;

  const part = (id: PartId) => ({
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `${COMPONENT_BY_ID[id].name}, ${PARTS.find((p) => p.id === id)!.stamp}${lit(id) ? ", implicated" : ""}`,
    onClick: () => setSelected(id),
    onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(id)),
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    className: `cursor-pointer outline-none transition-opacity ${active === id ? "opacity-100" : "opacity-90"} focus-visible:opacity-100`,
  });
  const stroke = (id: PartId) => (lit(id) ? "#ff9a3c" : active === id ? "#3fd8f2" : "rgba(255,255,255,0.22)");
  const fill = (id: PartId) => (lit(id) ? "rgba(255,154,60,0.14)" : active === id ? "rgba(63,216,242,0.10)" : "rgba(255,255,255,0.03)");
  const glow = (id: PartId) => (lit(id) ? { filter: "drop-shadow(0 0 6px rgba(255,154,60,0.55))" } : undefined);

  return (
    <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-fog-400">
            {litIds.length
              ? `Highlighted: where the evidence behind the latest answer points${basis ? ` (“${basis}”)` : ""}.`
              : "Ask about a fault and the parts the sources point to light up here. Tap any part to learn what it does."}
          </p>
          <span className="flex items-center gap-3 text-[11px] text-fog-500">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-hv" /> Implicated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-volt-400" /> Selected
            </span>
          </span>
        </div>

        <svg viewBox="0 0 640 330" className="w-full rounded-xl border border-white/[0.07] bg-ink-850" role="group" aria-label="Battery pack schematic, top view">
          <defs>
            <pattern id="bm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="rgba(63,216,242,0.05)" />
            </pattern>
          </defs>
          <rect width="640" height="330" fill="url(#bm-grid)" />
          <text x="16" y="24" className="fill-fog-500" fontSize="10" letterSpacing="2">
            TOP VIEW · FRONT ◂ ▸ REAR
          </text>

          {/* HV harness runs from the junction box out to the charging inlet */}
          <g {...part("hv-harness")} style={glow("hv-harness")}>
            <path d="M556 224 H600 V268 H560" fill="none" stroke="transparent" strokeWidth="16" />
            <path d="M556 224 H600 V268 H560" fill="none" stroke={stroke("hv-harness")} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={lit("hv-harness") ? "0" : "6 4"} />
            <text x="606" y="250" fontSize="9" className="fill-fog-400">HVH-01</text>
          </g>

          {/* Charging inlet */}
          <g {...part("charging-port")} style={glow("charging-port")}>
            <circle cx="540" cy="268" r="20" fill={fill("charging-port")} stroke={stroke("charging-port")} strokeWidth="1.5" />
            <circle cx="533" cy="262" r="2.5" className="fill-fog-400" />
            <circle cx="547" cy="262" r="2.5" className="fill-fog-400" />
            <circle cx="533" cy="274" r="2.5" className="fill-fog-400" />
            <circle cx="547" cy="274" r="2.5" className="fill-fog-400" />
            <text x="514" y="305" fontSize="9" className="fill-fog-400">CI-01</text>
          </g>

          {/* Pack enclosure */}
          <g {...part("battery-pack")} style={glow("battery-pack")}>
            <rect x="52" y="52" width="436" height="226" rx="16" fill={fill("battery-pack")} stroke={stroke("battery-pack")} strokeWidth="1.8" />
            <text x="64" y="68" fontSize="9" className="fill-fog-400">BP-01</text>
          </g>

          {/* Cooling plate: serpentine channel beneath the modules */}
          <g {...part("cooling-plate")} style={glow("cooling-plate")}>
            <path d="M66 148 H470 M66 163 H470 M66 258 H470" fill="none" stroke="transparent" strokeWidth="14" />
            <path d="M66 148 H470 M66 163 H470 M66 258 H470" fill="none" stroke={stroke("cooling-plate")} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" />
            <text x="388" y="272" fontSize="9" className="fill-fog-400">CP-01</text>
          </g>

          {/* Modules */}
          <g {...part("battery-modules")} style={glow("battery-modules")}>
            {MODULES.map((m) => {
              const named = modules.includes(m.n);
              const on = named || (modules.length === 0 && lit("battery-modules"));
              return (
                <g key={m.n}>
                  <rect
                    x={m.x}
                    y={m.y}
                    width="54"
                    height="62"
                    rx="5"
                    fill={named ? "rgba(255,154,60,0.38)" : on ? "rgba(255,154,60,0.16)" : fill("battery-modules")}
                    stroke={named ? "#ff9a3c" : on ? "#ff9a3c" : stroke("battery-modules")}
                    strokeWidth={named ? 2 : 1}
                  />
                  <text x={m.x + 27} y={m.y + 35} textAnchor="middle" fontSize="10" className={named ? "fill-fog-100" : "fill-fog-400"}>
                    M-{String(m.n).padStart(2, "0")}
                  </text>
                </g>
              );
            })}
          </g>

          {/* BMS */}
          <g {...part("bms")} style={glow("bms")}>
            <rect x="498" y="64" width="90" height="64" rx="6" fill={fill("bms")} stroke={stroke("bms")} strokeWidth="1.5" />
            <path d="M510 84h66M510 96h46M510 108h58" stroke={stroke("bms")} strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
            <text x="504" y="76" fontSize="9" className="fill-fog-400">BMS-01</text>
          </g>

          {/* HV junction box / contactors */}
          <g {...part("hv-junction-box")} style={glow("hv-junction-box")}>
            <rect x="498" y="190" width="58" height="68" rx="6" fill={fill("hv-junction-box")} stroke={stroke("hv-junction-box")} strokeWidth="1.5" />
            <circle cx="514" cy="212" r="5" fill="none" stroke={stroke("hv-junction-box")} />
            <circle cx="540" cy="212" r="5" fill="none" stroke={stroke("hv-junction-box")} />
            <text x="504" y="204" fontSize="9" className="fill-fog-400">HVJ-01</text>
          </g>

          {/* Sense links from BMS to modules */}
          <path d="M498 120 H478 V129 H132 M478 129 V209 H132" fill="none" stroke="rgba(63,216,242,0.18)" strokeDasharray="3 4" />
        </svg>

        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Parts">
          {PARTS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p.id)}
                aria-pressed={selected === p.id}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
                  selected === p.id ? "border-volt-400/60 bg-volt-400/10 text-fog-100" : "border-white/10 text-fog-400 hover:text-fog-100"
                }`}
              >
                <span className={`size-1.5 rounded-full ${lit(p.id) ? "bg-amber-hv" : "bg-white/20"}`} />
                <span className="font-mono text-[10.5px] text-fog-500">{p.stamp}</span>
                {COMPONENT_BY_ID[p.id].short}
                {hits[p.id] ? <span className="text-amber-hv">×{hits[p.id]}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* What this part does and what its failure causes */}
      <aside className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4" aria-live="polite">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] text-volt-300">{stamp}</p>
            <h3 className="mt-0.5 text-[15px] font-medium text-fog-100">{c.name}</h3>
          </div>
          {c.highVoltage && <span className="shrink-0 rounded-full bg-amber-hv/10 px-2 py-0.5 text-[10.5px] text-amber-hv">High voltage</span>}
        </div>
        {lit(active) && (
          <p className="mt-2 rounded-lg bg-amber-hv/[0.08] px-2.5 py-1.5 text-[12px] text-amber-hv">
            {hits[active] ? `Cited in ${hits[active]} passage${hits[active] === 1 ? "" : "s"} behind the latest answer.` : "Named in the conversation."}
          </p>
        )}
        <p className="mt-3 text-[12.5px] leading-relaxed text-fog-300">{c.function}</p>
        <p className="mt-4 mb-1.5 text-[10.5px] tracking-wider text-fog-500 uppercase">If this part is at fault</p>
        <ul className="space-y-2">
          {c.diagnosticRelevance.map((d) => (
            <li key={d} className="flex gap-2 text-[12.5px] leading-relaxed text-fog-300">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-volt-400" />
              {d}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => showComponentInfo(active)} className="mt-4 text-[12px] text-volt-400 hover:text-volt-300">
          Open full component page ↗
        </button>
        <p className="mt-4 text-[10.5px] leading-snug text-fog-500">Generic schematic. Layout and module count differ by vehicle; use your service documentation for exact positions.</p>
      </aside>
    </div>
  );
}
