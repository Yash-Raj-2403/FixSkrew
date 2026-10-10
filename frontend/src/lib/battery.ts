import type { ComponentId } from "../data/components";

/* ------------------------------ typed data model ------------------------------ */

export type MeasurementKey = "soc" | "soh" | "pack_voltage" | "cell_voltage_max" | "cell_voltage_min" | "battery_temp" | "current" | "other";

/** Where a dataset comes from. Only "live" is real-time vehicle telemetry. */
export type DataSource = "live" | "imported" | "demo";

export interface Reading {
  key: MeasurementKey;
  /** Name as reported by the source. */
  label: string;
  value: number;
  /** Unit as reported by the source (empty when the source gave none). */
  unit: string;
  /** ISO 8601 time the reading was taken. Absent when the source does not say. */
  timestamp?: string;
  /** Readings sharing a group were taken together (same timestamp or same document). */
  groupId: string;
  sourceName?: string;
}

export interface Dtc {
  code: string;
  description?: string;
  sourceName?: string;
}

export interface BatteryDataset {
  source: DataSource;
  /** Short badge text. */
  sourceLabel: string;
  /** One sentence explaining what the data is and its limits. */
  sourceDetail: string;
  vehicle: { label: string; known: boolean };
  readings: Reading[];
  dtcs: Dtc[];
  fetchedAt: string;
  /** Measurements in the source whose value was not a plain number. */
  skippedReadings?: number;
}

export interface MeasurementInfo {
  label: string;
  short: string;
  /** Unit shown when a source gives none and only for charts' axis titles. */
  group: "pack" | "cells" | "thermal" | "other";
  component: ComponentId;
}

export const MEASUREMENTS: Record<MeasurementKey, MeasurementInfo> = {
  soc: { label: "State of charge", short: "SOC", group: "pack", component: "battery-pack" },
  soh: { label: "State of health", short: "SOH", group: "pack", component: "bms" },
  pack_voltage: { label: "Pack voltage", short: "Pack V", group: "pack", component: "battery-pack" },
  battery_temp: { label: "Battery temperature", short: "Temp", group: "thermal", component: "cooling-plate" },
  cell_voltage_max: { label: "Highest cell voltage", short: "Cell max", group: "cells", component: "battery-modules" },
  cell_voltage_min: { label: "Lowest cell voltage", short: "Cell min", group: "cells", component: "battery-modules" },
  current: { label: "Pack current", short: "Current", group: "pack", component: "battery-pack" },
  other: { label: "Other readings", short: "Other", group: "other", component: "battery-pack" },
};

export const GROUPS = [
  { id: "all", label: "All components" },
  { id: "pack", label: "Battery pack" },
  { id: "cells", label: "Modules & cells" },
  { id: "thermal", label: "Thermal" },
] as const;
export type GroupId = (typeof GROUPS)[number]["id"];

export type RangeId = "24h" | "7d" | "all";
export const RANGES: { id: RangeId; label: string; ms: number }[] = [
  { id: "24h", label: "Last 24 h", ms: 24 * 3600_000 },
  { id: "7d", label: "Last 7 days", ms: 7 * 24 * 3600_000 },
  { id: "all", label: "All data", ms: Infinity },
];

/* ----------------------------------- helpers ----------------------------------- */

const time = (r: Reading) => (r.timestamp ? Date.parse(r.timestamp) : NaN);

export const hasTimestamps = (d: BatteryDataset) => d.readings.some((r) => !Number.isNaN(time(r)));

/** Readings kept by the filters. Time range is relative to the newest reading, not the clock. */
export function applyFilters(d: BatteryDataset, f: { group: GroupId; keys: MeasurementKey[]; range: RangeId }): Reading[] {
  const times = d.readings.map(time).filter((t) => !Number.isNaN(t));
  const newest = times.length ? Math.max(...times) : NaN;
  const span = RANGES.find((r) => r.id === f.range)!.ms;
  return d.readings.filter((r) => {
    if (f.group !== "all" && MEASUREMENTS[r.key].group !== f.group) return false;
    if (f.keys.length && !f.keys.includes(r.key)) return false;
    const t = time(r);
    if (!Number.isNaN(t) && Number.isFinite(span) && t < newest - span) return false;
    return true;
  });
}

/** Most recent reading of a measurement (by time when known, else the last one listed). */
export function latest(readings: Reading[], key: MeasurementKey): Reading | undefined {
  const of = readings.filter((r) => r.key === key);
  if (of.length === 0) return undefined;
  return of.some((r) => !Number.isNaN(time(r))) ? [...of].filter((r) => !Number.isNaN(time(r))).sort((a, b) => time(a) - time(b)).at(-1) : of.at(-1);
}

export interface Point {
  t: number;
  v: number;
}

export function series(readings: Reading[], key: MeasurementKey): Point[] {
  return readings
    .filter((r) => r.key === key && !Number.isNaN(time(r)))
    .map((r) => ({ t: time(r), v: r.value }))
    .sort((a, b) => a.t - b.t);
}

export interface Spread {
  /** max - min cell voltage, in the source's unit. */
  value: number;
  unit: string;
  max: Reading;
  min: Reading;
  groupId: string;
}

/** Cell voltage spread per group of readings taken together. Needs both a max and a min in the same group and unit. */
export function spreads(readings: Reading[]): Spread[] {
  const byGroup = new Map<string, { max?: Reading; min?: Reading }>();
  for (const r of readings) {
    if (r.key !== "cell_voltage_max" && r.key !== "cell_voltage_min") continue;
    const g = byGroup.get(r.groupId) ?? {};
    if (r.key === "cell_voltage_max") g.max = r;
    else g.min = r;
    byGroup.set(r.groupId, g);
  }
  const out: Spread[] = [];
  for (const [groupId, { max, min }] of byGroup) {
    if (!max || !min || max.unit !== min.unit) continue;
    out.push({ value: max.value - min.value, unit: max.unit, max, min, groupId });
  }
  return out.sort((a, b) => (time(a.max) || 0) - (time(b.max) || 0));
}

/** Format a reading value with a sensible number of decimals. */
export const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.?0+$/, (m) => (m.includes(".") ? "" : m));
