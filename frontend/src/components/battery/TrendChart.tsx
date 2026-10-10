import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Point } from "../../lib/battery";

export interface ChartSeries {
  name: string;
  color: string;
  points: Point[];
}

const dayHour = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const hourOnly = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

/** Line chart of timestamped readings. Pure presentation: data comes in already filtered. */
export function TrendChart({ title, unit, series, decimals = 1 }: { title: string; unit: string; series: ChartSeries[]; decimals?: number }) {
  const rows = new Map<number, Record<string, number>>();
  for (const s of series) for (const p of s.points) rows.set(p.t, { ...(rows.get(p.t) ?? { t: p.t }), [s.name]: p.v });
  const data = [...rows.values()].sort((a, b) => a.t - b.t);
  const span = data.length ? data[data.length - 1].t - data[0].t : 0;
  const tick = (t: number) => (span > 36 * 3600_000 ? dayHour : hourOnly).format(t);
  const all = series.flatMap((s) => s.points.map((p) => p.v));
  const lo = Math.min(...all);
  const hi = Math.max(...all);

  return (
    <figure className="glass rounded-2xl p-4 sm:p-5">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-fog-100">{title}</span>
        <span className="font-mono text-[11px] text-fog-500">{unit}</span>
      </figcaption>
      <div className="h-56" role="img" aria-label={`${title} over time. Range ${lo.toFixed(decimals)} to ${hi.toFixed(decimals)} ${unit} across ${data.length} readings.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={tick} tick={{ fill: "#8a95a2", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" minTickGap={48} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "#8a95a2", fontSize: 11 }} stroke="rgba(255,255,255,0.12)" width={52} tickFormatter={(v: number) => v.toFixed(decimals)} />
            <Tooltip
              contentStyle={{ background: "#10141a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "#b7c0ca" }}
              labelFormatter={(t) => dayHour.format(Number(t))}
              formatter={(v) => `${Number(v).toFixed(decimals)} ${unit}`}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: "#8a95a2" }} />}
            {series.map((s) => (
              <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={1.8} dot={false} activeDot={{ r: 3 }} connectNulls isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
