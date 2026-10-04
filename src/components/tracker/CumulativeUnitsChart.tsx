"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatUnits,
  longDate,
  type SeriesPoint,
} from "@/lib/tracker-metrics";

const GOLD = "#f5c542";
const LINE = "#2a3343";
const MUTED = "#aab4c4";

function axisUnits(v: number) {
  if (Math.abs(v) < 1e-9) return "0u";
  return `${v > 0 ? "+" : "\u2212"}${Math.abs(v)}u`;
}

/** Evenly stepped ticks that always include zero and the full negative range. */
function niceAxis(low: number, high: number) {
  const raw = (high - low || 1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const min = Math.floor(low / step) * step;
  const max = Math.ceil(high / step) * step;
  const lo = low < 0 && low - min < step * 0.15 ? min - step : min;
  const hi = max - high < step * 0.15 ? max + step : max;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { domain: [lo, hi] as [number, number], ticks };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SeriesPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-control border border-line bg-raised px-3 py-2 text-xs shadow-lg">
      <p className="m-0 text-muted">
        {p.date && p.label !== "Start" ? longDate(p.date) : "Period start"}
      </p>
      <p className="m-0 mt-1 font-semibold text-ink">
        Cumulative {formatUnits(p.cumulative)}
      </p>
      {p.label !== "Start" && (
        <p className="m-0 text-muted">Day {formatUnits(p.dayNet)}</p>
      )}
    </div>
  );
}

export function CumulativeUnitsChart({
  series,
  rangeLabel,
}: {
  series: SeriesPoint[];
  rangeLabel: string;
}) {
  const values = series.map((s) => s.cumulative);
  const { domain, ticks } = niceAxis(Math.min(0, ...values), Math.max(0, ...values));

  return (
    <section className="card @container" aria-labelledby="curve-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="curve-title" className="m-0 text-[17px] font-semibold">
            Cumulative net units
          </h2>
          <p className="m-0 text-xs text-muted">
            From zero at the start of the selected period
          </p>
        </div>
        <span className="eyebrow">{rangeLabel}</span>
      </div>

      {series.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-control border border-dashed border-line text-muted">
          No graded picks match these filters.
        </div>
      ) : (
        <>
          <div className="h-[220px] @2xl:h-[300px]">
              <AreaChart
                responsive
                style={{ width: "100%", height: "100%" }}
                data={series}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={LINE} strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: LINE }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  domain={domain}
                  ticks={ticks}
                  tickFormatter={axisUnits}
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <ReferenceLine y={0} stroke={MUTED} strokeOpacity={0.6} />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: MUTED, strokeOpacity: 0.4 }}
                />
                <Area
                  type="linear"
                  dataKey="cumulative"
                  baseValue={0}
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#curve-fill)"
                  dot={series.length <= 45 ? { r: 2.5, fill: GOLD, strokeWidth: 0 } : false}
                  activeDot={{ r: 4, fill: GOLD, stroke: "#090b10", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
          </div>
          <p className="mt-2 text-xs text-muted">
            Gold shows the complete path, including declines. Hover, tap or use
            arrow keys on the chart for values.
          </p>
          <details className="mt-3">
            <summary className="flex items-center gap-2 text-[13px] font-medium">
              <span className="chevron text-muted">›</span> View daily values
            </summary>
            <div className="mt-3 max-h-[320px] overflow-auto rounded-control border border-line">
              <table className="w-full border-collapse text-[13px]">
                <caption className="sr-only">Daily and cumulative net units</caption>
                <thead className="sticky top-0 bg-surface">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">Day</th>
                    <th className="px-3 py-2 text-right font-medium">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {series.slice(1).map((p) => (
                    <tr key={p.date} className="border-t border-line">
                      <td className="px-3 py-2">{p.date ? longDate(p.date) : "—"}</td>
                      <td className="px-3 py-2 text-right">{formatUnits(p.dayNet)}</td>
                      <td className="px-3 py-2 text-right">{formatUnits(p.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
