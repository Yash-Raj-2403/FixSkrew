import { useMemo, useState } from "react";
import { COMPONENT_BY_ID, type ComponentId } from "../../data/components";
import {
  GROUPS,
  MEASUREMENTS,
  RANGES,
  applyFilters,
  fmt,
  hasTimestamps,
  latest,
  series,
  spreads,
  type BatteryDataset,
  type GroupId,
  type MeasurementKey,
  type RangeId,
  type Reading,
} from "../../lib/battery";
import { navigate, showComponentInfo } from "../../lib/router";
import { useBattery } from "../../lib/useBattery";
import { TrendChart } from "./TrendChart";

const VOLT = "#3fd8f2";
const AMBER = "#ff9a3c";

/* ------------------------------- small pieces ------------------------------- */

function SourceBadge({ d }: { d: BatteryDataset }) {
  const style =
    d.source === "live"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
      : d.source === "imported"
        ? "border-volt-400/40 bg-volt-400/10 text-volt-300"
        : "border-amber-hv/50 bg-amber-hv/10 text-amber-hv";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11.5px] font-medium ${style}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {d.sourceLabel}
    </span>
  );
}

function Metric({ label, value, unit, note, component, muted }: { label: string; value?: string; unit?: string; note?: string; component?: ComponentId; muted?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-4 sm:p-5 ${muted ? "opacity-75" : ""}`}>
      <p className="eyebrow text-[10px]!">{label}</p>
      {value !== undefined ? (
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-medium tracking-tight text-fog-100 tabular-nums">{value}</span>
          <span className="font-mono text-sm text-fog-400">{unit}</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-fog-500">Not reported</p>
      )}
      <p className="mt-2 min-h-8 text-[11.5px] leading-snug text-fog-500">{note}</p>
      {component && (
        <button type="button" onClick={() => showComponentInfo(component)} className="mt-1 text-[11.5px] text-volt-400 hover:text-volt-300">
          {COMPONENT_BY_ID[component].short} ↗
        </button>
      )}
    </div>
  );
}

const when = (r?: Reading) =>
  r?.timestamp ? `As of ${new Date(r.timestamp).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : r?.sourceName ? `From ${r.sourceName}` : undefined;

function Notice({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  return (
    <p className={`rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${tone === "warn" ? "border-amber-hv/40 bg-amber-hv/[0.07] text-amber-hv" : "border-white/10 bg-white/[0.03] text-fog-300"}`}>{children}</p>
  );
}

/* ------------------------------ page states ------------------------------ */

function Skeleton() {
  return (
    <div role="status" aria-label="Loading battery data" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass h-36 animate-pulse rounded-2xl motion-reduce:animate-none" />
        ))}
      </div>
      <div className="glass h-72 animate-pulse rounded-2xl motion-reduce:animate-none" />
    </div>
  );
}

function StateCard({ title, children, actions }: { title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div className="glass mx-auto max-w-xl rounded-2xl p-8 text-center">
      <h2 className="text-lg font-medium text-fog-100">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-fog-400">{children}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}

const primary = "rounded-full bg-volt-400 px-5 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-volt-300";
const ghost = "rounded-full border border-white/15 px-5 py-2 text-sm text-fog-100 transition-colors hover:border-volt-400/50";

/* -------------------------------- dashboard -------------------------------- */

function Dashboard({ d }: { d: BatteryDataset }) {
  const timed = hasTimestamps(d);
  const [group, setGroup] = useState<GroupId>("all");
  const [keys, setKeys] = useState<MeasurementKey[]>([]);
  const [range, setRange] = useState<RangeId>("all");

  const present = useMemo(() => [...new Set(d.readings.map((r) => r.key))], [d.readings]);
  const visible = useMemo(() => applyFilters(d, { group, keys, range: timed ? range : "all" }), [d, group, keys, range, timed]);
  const show = (k: MeasurementKey) => visible.some((r) => r.key === k);
  const core: MeasurementKey[] = ["soc", "soh", "pack_voltage", "battery_temp"];
  const inGroup = (k: MeasurementKey) => group === "all" || MEASUREMENTS[k].group === group;
  const sp = spreads(visible);
  const lastSpread = sp.at(-1);
  const spreadMv = lastSpread?.unit.toLowerCase() === "v";
  const others = visible.filter((r) => r.key === "other");

  const charted = (["soc", "pack_voltage", "battery_temp", "soh", "current"] as MeasurementKey[]).filter((k) => series(visible, k).length >= 2);
  const cellSeries = [
    { name: "Highest cell", color: VOLT, points: series(visible, "cell_voltage_max") },
    { name: "Lowest cell", color: AMBER, points: series(visible, "cell_voltage_min") },
  ].filter((s) => s.points.length >= 2);
  const spreadPoints = sp.filter((s) => s.max.timestamp).map((s) => ({ t: Date.parse(s.max.timestamp!), v: spreadMv ? s.value * 1000 : s.value }));

  const toggleKey = (k: MeasurementKey) => setKeys((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const select = "field py-1.5! text-xs!";

  return (
    <div className="space-y-6">
      <Notice tone={d.source === "demo" ? "warn" : "info"}>
        <strong className="font-medium">{d.sourceLabel}.</strong> {d.sourceDetail}
        {d.skippedReadings ? ` ${d.skippedReadings} reading${d.skippedReadings === 1 ? "" : "s"} in the documents had no plain numeric value and are not shown.` : ""}
      </Notice>

      {/* filters */}
      <section aria-label="Filters" className="glass flex flex-wrap items-end gap-4 rounded-2xl p-4">
        <label className="block min-w-40">
          <span className="mb-1 block text-[11px] text-fog-400">Vehicle</span>
          <select className={select} value="0" disabled aria-describedby="veh-note">
            <option value="0">{d.vehicle.label}</option>
          </select>
        </label>
        <label className="block min-w-40">
          <span className="mb-1 block text-[11px] text-fog-400">Component</span>
          <select className={select} value={group} onChange={(e) => setGroup(e.target.value as GroupId)}>
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-40">
          <span className="mb-1 block text-[11px] text-fog-400">Time range</span>
          <select className={select} value={timed ? range : "all"} disabled={!timed} onChange={(e) => setRange(e.target.value as RangeId)} title={timed ? undefined : "This dataset has no timestamps"}>
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="min-w-0 flex-1">
          <legend className="mb-1 text-[11px] text-fog-400">Measurement</legend>
          <div className="flex flex-wrap gap-1.5">
            {present.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={keys.includes(k)}
                onClick={() => toggleKey(k)}
                className={`rounded-full border px-3 py-1 text-[11.5px] transition-colors ${keys.includes(k) ? "border-volt-400/60 bg-volt-400/10 text-fog-100" : "border-white/10 text-fog-400 hover:text-fog-100"}`}
              >
                {MEASUREMENTS[k].short}
              </button>
            ))}
            {keys.length > 0 && (
              <button type="button" onClick={() => setKeys([])} className="px-2 text-[11.5px] text-fog-500 hover:text-fog-100">
                Clear
              </button>
            )}
          </div>
        </fieldset>
        <p id="veh-note" className="sr-only">
          Only one vehicle is available in this dataset.
        </p>
      </section>
      {!timed && <p className="-mt-3 text-[12px] text-fog-500">No timestamps in this dataset, so there is no history to chart or filter by time.</p>}

      {/* current values */}
      <section aria-label="Current readings" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {core
          .filter((k) => inGroup(k) && (keys.length === 0 || keys.includes(k)))
          .map((k) => {
            const r = show(k) ? latest(visible, k) : undefined;
            return <Metric key={k} label={MEASUREMENTS[k].label} value={r ? fmt(r.value) : undefined} unit={r?.unit} note={when(r)} component={MEASUREMENTS[k].component} muted={!r} />;
          })}
        {(["cell_voltage_max", "cell_voltage_min", "current"] as MeasurementKey[])
          .filter((k) => show(k))
          .map((k) => {
            const r = latest(visible, k)!;
            return <Metric key={k} label={MEASUREMENTS[k].label} value={fmt(r.value)} unit={r.unit} note={when(r)} component={MEASUREMENTS[k].component} />;
          })}
        {lastSpread && (
          <Metric
            label="Cell voltage spread"
            value={fmt(spreadMv ? lastSpread.value * 1000 : lastSpread.value)}
            unit={spreadMv ? "mV" : lastSpread.unit}
            note="Highest minus lowest cell. One spread value does not confirm a fault."
            component="battery-modules"
          />
        )}
      </section>
      {!lastSpread && inGroup("cell_voltage_max") && (
        <p className="-mt-3 text-[12px] text-fog-500">Voltage spread is not shown: it needs both a highest and a lowest cell voltage reading with the same unit.</p>
      )}

      {/* history */}
      {(charted.length > 0 || cellSeries.length > 0) && (
        <section aria-label="History" className="grid gap-4 lg:grid-cols-2">
          {charted.map((k) => {
            const unit = visible.find((r) => r.key === k)?.unit ?? "";
            return <TrendChart key={k} title={MEASUREMENTS[k].label} unit={unit} series={[{ name: MEASUREMENTS[k].short, color: VOLT, points: series(visible, k) }]} />;
          })}
          {cellSeries.length > 0 && <TrendChart title="Cell voltage, highest and lowest" unit={visible.find((r) => r.key === "cell_voltage_max")?.unit ?? ""} decimals={3} series={cellSeries} />}
          {spreadPoints.length >= 2 && <TrendChart title="Cell voltage spread" unit={spreadMv ? "mV" : (lastSpread?.unit ?? "")} decimals={1} series={[{ name: "Spread", color: AMBER, points: spreadPoints }]} />}
        </section>
      )}
      {timed && charted.length === 0 && cellSeries.length === 0 && <Notice tone="info">No measurement has two or more readings in this selection, so there is nothing to chart. Widen the time range or clear filters.</Notice>}

      {others.length > 0 && (
        <section aria-label="Other readings" className="glass rounded-2xl p-5">
          <h2 className="eyebrow mb-3 text-[10px]!">Other readings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] text-fog-500">
                <tr>
                  <th className="py-1 pr-4 font-normal">Measurement</th>
                  <th className="py-1 pr-4 font-normal">Value</th>
                  <th className="py-1 font-normal">Source</th>
                </tr>
              </thead>
              <tbody>
                {others.map((r, i) => (
                  <tr key={i} className="border-t border-white/[0.06]">
                    <td className="py-1.5 pr-4 text-fog-300">{r.label}</td>
                    <td className="py-1.5 pr-4 font-mono text-fog-100">
                      {fmt(r.value)} {r.unit}
                    </td>
                    <td className="py-1.5 text-fog-500">{r.sourceName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* trouble codes */}
      <section aria-label="Diagnostic trouble codes" className="glass rounded-2xl p-5">
        <h2 className="eyebrow mb-3 text-[10px]!">Diagnostic trouble codes</h2>
        {d.dtcs.length === 0 ? (
          <p className="text-sm text-fog-500">No trouble codes were found in this dataset. That does not mean none are stored in the vehicle.</p>
        ) : (
          <ul className="space-y-2">
            {d.dtcs.map((c) => (
              <li key={c.code} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                <span className="rounded bg-amber-hv/10 px-1.5 py-px font-mono text-[12px] text-amber-hv">{c.code}</span>
                <span className="min-w-0 flex-1 text-[13px] text-fog-300">{c.description ?? "No description given in the source."}</span>
                <span className="text-[11px] text-fog-500">Status not reported · {c.sourceName}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11.5px] leading-snug text-fog-500">A code listed in a document is a lead, not a confirmed active fault. Confirm with a live scan.</p>
      </section>

      <Notice tone="info">
        No warning thresholds are applied. Limits depend on the battery configuration and must come from its service documentation, and none are loaded here. A reading on its own does not confirm a battery fault.
      </Notice>
    </div>
  );
}

/* ----------------------------------- page ----------------------------------- */

/** `onUpload` is given when embedded in the diagnosis workspace, which is where documents are added. */
export function BatteryDashboard({ onUpload }: { onUpload?: () => void } = {}) {
  const embedded = Boolean(onUpload);
  const b = useBattery();
  const dataset = b.state.status === "ready" ? b.state.dataset : null;

  return (
    <section className={embedded ? "relative" : "relative min-h-[100svh] bg-ink-900 pt-32 pb-20 sm:pt-40 sm:pb-28"}>
      {!embedded && <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(63,216,242,0.1),transparent_65%)]" />}
      <div className={embedded ? "relative p-5 sm:p-7" : "relative mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12"}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {!embedded && <p className="eyebrow mb-3">Battery health</p>}
            <h1 className={embedded ? "text-xl font-semibold tracking-tight text-fog-100" : "text-3xl font-semibold tracking-tight text-fog-100 sm:text-[2.5rem]"}>{dataset?.vehicle.label ?? "Battery dashboard"}</h1>
            {dataset && (
              <p className="mt-2 text-[12px] text-fog-500">
                Updated {new Date(dataset.fetchedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {dataset && <SourceBadge d={dataset} />}
            {b.refresh && b.state.status === "ready" && (
              <button type="button" onClick={b.refresh} disabled={b.refreshing} className={`${ghost} py-1.5! text-xs! disabled:opacity-60`}>
                {b.refreshing ? "Refreshing…" : "Refresh"}
              </button>
            )}
            {b.mode === "demo" && (
              <button type="button" onClick={b.showImported} className={`${ghost} py-1.5! text-xs!`}>
                Back to case data
              </button>
            )}
            {!embedded && (
              <button type="button" onClick={() => navigate("/diagnose")} className={`${primary} py-1.5! text-xs!`}>
                Open diagnosis
              </button>
            )}
          </div>
        </div>

        <div className="mt-8" aria-live="polite">
          {b.state.status === "loading" && <Skeleton />}
          {b.state.status === "error" && (
            <StateCard
              title="Battery data could not be loaded"
              actions={
                <>
                  <button type="button" onClick={b.retry} className={primary}>
                    Try again
                  </button>
                  {!embedded && (
                    <button type="button" onClick={() => navigate("/diagnose")} className={ghost}>
                      Open diagnosis
                    </button>
                  )}
                </>
              }
            >
              {b.state.message} Nothing is shown in its place, so no values are made up.
            </StateCard>
          )}
          {b.state.status === "empty" && (
            <StateCard
              title="No battery readings yet"
              actions={
                <>
                  <button type="button" onClick={onUpload ?? (() => navigate("/diagnose"))} className={primary}>
                    Upload documents
                  </button>
                  <button type="button" onClick={b.showDemo} className={ghost}>
                    Preview with simulated data
                  </button>
                </>
              }
            >
              {b.state.reason === "no_case"
                ? "There is no diagnosis case yet. Upload a scan report or log in the diagnosis workspace and its battery readings and trouble codes will appear here."
                : "The documents in this case contain no battery readings or trouble codes that could be read."}{" "}
              The preview uses simulated values, clearly labelled, and is not vehicle data.
            </StateCard>
          )}
          {dataset && <Dashboard key={dataset.source} d={dataset} />}
        </div>

        <nav aria-label="Battery components" className="mt-10 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-6">
          <span className="mr-2 text-[12px] text-fog-500">Components:</span>
          {(["battery-pack", "battery-modules", "bms", "cooling-plate", "hv-junction-box"] as ComponentId[]).map((id) => (
            <button key={id} type="button" onClick={() => showComponentInfo(id)} className="rounded-full border border-white/10 px-3 py-1 text-[12px] text-fog-400 transition-colors hover:border-volt-400/50 hover:text-volt-300">
              {COMPONENT_BY_ID[id].short} ↗
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
