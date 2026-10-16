"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Pick, SeasonStats } from "@/lib/types";
import { formatSigned, round2, unitsFromPick } from "@/lib/stats";

type ChartRange = "week" | "month" | "all";

const GOLD = "#ffd60a";
const GOLD_BRIGHT = "#ffe566";
const GOLD_DEEP = "#f5b800";
const RED = "#eb4669";
const MUTED = "#9ca3af";
const GRID = "rgba(255, 255, 255, 0.08)";

function useIsMobile(breakpoint = 640) {
  // Mobile-first default avoids a desktop→mobile flash on phones.
  const [mobile, setMobile] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpoint]);
  return mobile;
}

/** Evenly spaced categorical ticks so mobile x-axis dates don't stack. */
function pickAxisTicks(labels: string[], maxTicks: number): string[] {
  const series = labels[0] === "Open" ? labels.slice(1) : labels;
  if (series.length <= maxTicks) return series;
  const ticks: string[] = [];
  for (let i = 0; i < maxTicks; i++) {
    const idx = Math.round((i * (series.length - 1)) / (maxTicks - 1));
    ticks.push(series[idx]);
  }
  return [...new Set(ticks)];
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "u",
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = typeof payload[0].value === "number" ? payload[0].value : 0;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[13px] shadow-xl">
      <p className="text-muted">{label}</p>
      <p className="mt-0.5 font-semibold text-win-bright">
        {formatSigned(value)}
        {suffix}
      </p>
    </div>
  );
}

const tooltipWrapper = { outline: "none", zIndex: 20 } as const;
const darkCursorBar = {
  fill: "rgba(255, 214, 10, 0.08)",
  stroke: "transparent",
} as const;
const darkCursorLine = {
  stroke: "rgba(255, 214, 10, 0.5)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
} as const;

function SectionHead({ title, copy }: { title: string; copy?: string }) {
  return (
    <div className="mb-5 max-w-2xl">
      <h2 className="section-title">{title}</h2>
      {copy ? <p className="section-copy">{copy}</p> : null}
    </div>
  );
}

function periodWindow(
  range: ChartRange,
  seasonEnd: string | null,
): { start: string; end: string } | null {
  if (range === "all" || !seasonEnd) return null;
  const endDate = parseISO(seasonEnd);
  if (range === "week") {
    return {
      start: format(startOfWeek(endDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      end: format(endOfWeek(endDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }
  return {
    start: format(startOfMonth(endDate), "yyyy-MM-dd"),
    end: format(endOfMonth(endDate), "yyyy-MM-dd"),
  };
}

function formatRangeLabel(
  range: ChartRange,
  start: string | null,
  end: string | null,
): string {
  if (!start || !end) return "No data";
  if (range === "all") {
    return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d, yyyy")}`;
  }
  if (range === "month") {
    return format(parseISO(start), "MMMM yyyy");
  }
  return `${format(parseISO(start), "MMM d")} – ${format(parseISO(end), "MMM d")}`;
}

function periodStats(picks: Pick[], start: string | null, end: string | null) {
  const settled = picks.filter((p) => {
    if (p.result === "pending") return false;
    if (start && p.date < start) return false;
    if (end && p.date > end) return false;
    return true;
  });
  let profit = 0;
  let stake = 0;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  for (const p of settled) {
    stake = round2(stake + p.units);
    profit = round2(profit + unitsFromPick(p.odds, p.units, p.result));
    if (p.result === "win") wins += 1;
    else if (p.result === "loss") losses += 1;
    else if (p.result === "push") pushes += 1;
  }
  const roi = stake === 0 ? 0 : round2((profit / stake) * 100);
  return { profit, roi, wins, losses, pushes };
}

function ChartFrame({
  heightClass,
  children,
}: {
  heightClass: string;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className={`${heightClass} w-full`}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted">
          Loading chart…
        </div>
      )}
    </div>
  );
}

export function CumulativeChart({
  stats,
  picks = [],
}: {
  stats: SeasonStats;
  picks?: Pick[];
}) {
  const isMobile = useIsMobile();
  const [range, setRange] = useState<ChartRange>("month");

  const window = useMemo(
    () => periodWindow(range, stats.seasonEnd),
    [range, stats.seasonEnd],
  );

  const data = useMemo(() => {
    if (!isMobile || range === "all") {
      return stats.cumulativeSeries.map((p) => ({
        ...p,
        value: p.cumulative,
      }));
    }
    const start = window?.start;
    const end = window?.end;
    const days = stats.daily.filter((d) => {
      if (start && d.date < start) return false;
      if (end && d.date > end) return false;
      return true;
    });
    let running = 0;
    const openDate = days[0]?.date ?? start ?? stats.seasonStart ?? "";
    return [
      { date: openDate, label: "Open", cumulative: 0, value: 0 },
      ...days.map((d) => {
        running = round2(running + d.units);
        return {
          date: d.date,
          label: d.label,
          cumulative: running,
          value: running,
        };
      }),
    ];
  }, [isMobile, range, window, stats.cumulativeSeries, stats.daily, stats.seasonStart]);

  const metrics = useMemo(() => {
    if (!isMobile) return null;
    const start =
      range === "all" ? stats.seasonStart : (window?.start ?? null);
    const end = range === "all" ? stats.seasonEnd : (window?.end ?? null);
    return periodStats(picks, start, end);
  }, [isMobile, range, window, picks, stats.seasonStart, stats.seasonEnd]);

  const rangeLabel = useMemo(() => {
    if (range === "all") {
      return formatRangeLabel("all", stats.seasonStart, stats.seasonEnd);
    }
    return formatRangeLabel(range, window?.start ?? null, window?.end ?? null);
  }, [range, window, stats.seasonStart, stats.seasonEnd]);

  const xTicks = pickAxisTicks(
    data.map((d) => d.label),
    isMobile ? 5 : 8,
  );

  return (
    <div className={isMobile ? "" : "panel-soft p-8"}>
      {isMobile ? (
        <div className="space-y-3">
          <div className="mobile-card flex p-1">
            {(
              [
                ["week", "Week"],
                ["month", "Month"],
                ["all", "All time"],
              ] as const
            ).map(([key, label]) => {
              const active = range === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={`flex-1 rounded-[0.75rem] py-2.5 text-center text-[13px] font-bold transition-colors ${
                    active
                      ? "bg-surface-3 text-white"
                      : "text-muted hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-[1.15rem] font-extrabold leading-none tracking-tight text-white">
            {rangeLabel}
          </p>
          {metrics ? (
            <div className="grid grid-cols-3 gap-3 pt-1">
              <PeriodStat
                label="Profit"
                value={`${formatSigned(metrics.profit)}u`}
                tone={
                  metrics.profit > 0
                    ? "win"
                    : metrics.profit < 0
                      ? "loss"
                      : "muted"
                }
              />
              <PeriodStat
                label="ROI"
                value={`${formatSigned(metrics.roi)}%`}
                tone={
                  metrics.roi > 0 ? "win" : metrics.roi < 0 ? "loss" : "muted"
                }
              />
              <PeriodStat
                label="Record"
                value={`${metrics.wins}-${metrics.losses}-${metrics.pushes}`}
                tone="muted"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <SectionHead title="Cumulative Unit Curve" />
      )}
      {data.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-muted sm:h-[340px]">
          No chart data yet.
        </div>
      ) : (
        <div className={isMobile ? "-mx-4 mt-4" : undefined}>
          <ChartFrame heightClass="h-[220px] sm:h-[340px]">
            <AreaChart
              data={data}
              margin={
                isMobile
                  ? { top: 16, right: 16, left: 12, bottom: 4 }
                  : { top: 36, right: 28, left: 0, bottom: 8 }
              }
            >
              <defs>
                <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD_DEEP} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={GOLD_DEEP} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cumStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={GOLD_DEEP} />
                  <stop offset="100%" stopColor={GOLD_BRIGHT} />
                </linearGradient>
              </defs>
              {!isMobile && <CartesianGrid stroke={GRID} vertical={false} />}
              <XAxis
                dataKey="label"
                ticks={xTicks}
                tick={{
                  fill: MUTED,
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 600,
                }}
                axisLine={false}
                tickLine={false}
                interval={0}
                padding={{ left: 4, right: 4 }}
              />
              <YAxis
                hide={isMobile}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}u`}
                tick={{ fill: MUTED, fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={48}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={darkCursorLine}
                wrapperStyle={tooltipWrapper}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload as never}
                    label={label === "Open" ? "Open" : String(label)}
                    suffix="u cumulative"
                  />
                )}
              />
              <Area
                type="stepAfter"
                dataKey="cumulative"
                stroke="url(#cumStroke)"
                strokeWidth={isMobile ? 2.8 : 2.6}
                fill={isMobile ? "transparent" : "url(#cumFill)"}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 5, fill: GOLD_BRIGHT, stroke: "#000" }}
              />
              {!isMobile &&
                stats.annotations.map((a) => {
                  const point = [...stats.cumulativeSeries]
                    .reverse()
                    .find((c) => c.date === a.date && c.label !== "Open");
                  if (!point) return null;
                  const index = stats.cumulativeSeries.indexOf(point);
                  const total = stats.cumulativeSeries.length;
                  const anchor =
                    index >= total - 3
                      ? "end"
                      : index <= 2
                        ? "start"
                        : "middle";
                  return (
                    <ReferenceDot
                      key={`peak-${a.date}`}
                      x={point.label}
                      y={a.cumulative}
                      r={3.5}
                      fill={GOLD}
                      stroke="#000"
                      label={(props) => (
                        <AnnotationLabel
                          viewBox={props.viewBox as { x?: number; y?: number }}
                          text={a.label}
                          anchor={anchor}
                        />
                      )}
                    />
                  );
                })}
            </AreaChart>
          </ChartFrame>
        </div>
      )}
      {!isMobile ? (
        <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <MetricLine
            label="Peak"
            value={
              stats.peak
                ? `${formatSigned(stats.peak.units)}u · ${stats.peak.weekLabel}`
                : "—"
            }
          />
          <MetricLine
            label="Largest drawdown"
            value={
              stats.largestDrawdown
                ? `${formatSigned(stats.largestDrawdown.amount)}u · ${stats.largestDrawdown.fromLabel} → ${stats.largestDrawdown.toLabel}`
                : "—"
            }
          />
          <MetricLine
            label="Season finish"
            value={`${formatSigned(stats.netUnits)}u`}
          />
        </div>
      ) : null}
    </div>
  );
}

function PeriodStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "win" | "loss" | "muted";
}) {
  const valueClass =
    tone === "win"
      ? "text-win"
      : tone === "loss"
        ? "text-[var(--red-soft)]"
        : "text-white";
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className={`mt-1 text-[1.05rem] font-extrabold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function AnnotationLabel({
  text,
  viewBox,
  anchor = "middle",
}: {
  text: string;
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
  anchor?: "start" | "middle" | "end";
}) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  const dx = anchor === "end" ? 6 : anchor === "start" ? -6 : 0;

  return (
    <text
      x={x + dx}
      y={y - 14}
      textAnchor={anchor}
      fill={GOLD}
      fontSize={12}
      fontWeight={700}
    >
      {text}
    </text>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-sm text-white">
        {value}
      </p>
    </div>
  );
}

export function WeeklyBars({ stats }: { stats: SeasonStats }) {
  return (
    <div className="panel p-6 sm:p-7">
      <SectionHead
        title="Daily Performance"
        copy="Net units day by day — yellow above zero, red below."
      />
      {stats.daily.length === 0 ? (
        <EmptyChart />
      ) : (
        <ChartFrame heightClass="h-[220px] sm:h-[260px]">
          <BarChart data={stats.daily}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: MUTED, fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: MUTED, fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              cursor={darkCursorBar}
              wrapperStyle={tooltipWrapper}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload as never}
                  label={`${label}`}
                />
              )}
            />
            <Bar dataKey="units" radius={[4, 4, 4, 4]}>
              {stats.daily.map((d) => (
                <Cell
                  key={d.date}
                  fill={d.units >= 0 ? GOLD : RED}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartFrame>
      )}
    </div>
  );
}

export function MonthlyBars({ stats }: { stats: SeasonStats }) {
  return (
    <div className="panel h-full p-6 sm:p-7">
      <SectionHead title="Monthly Performance" copy="Net units by calendar month." />
      {stats.monthly.length === 0 ? (
        <EmptyChart />
      ) : (
        <ChartFrame heightClass="h-[200px]">
          <BarChart data={stats.monthly}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: MUTED, fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: MUTED, fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              cursor={darkCursorBar}
              wrapperStyle={tooltipWrapper}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload as never}
                  label={String(label)}
                />
              )}
            />
            <Bar dataKey="units" radius={[6, 6, 6, 6]}>
              {stats.monthly.map((m) => (
                <Cell
                  key={m.key}
                  fill={m.units >= 0 ? GOLD : RED}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartFrame>
      )}
    </div>
  );
}

export function WinsLossesDonut({ stats }: { stats: SeasonStats }) {
  const data = [
    { name: "Wins", value: stats.winningDays, color: GOLD },
    { name: "Losses", value: stats.losingDays, color: RED },
  ].filter((d) => d.value > 0);

  return (
    <div className="panel h-full p-6 sm:p-7">
      <SectionHead title="Wins vs Losses" copy="Share of days by outcome." />
      <div className="relative mt-1 h-[200px] w-full">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <>
            <ChartFrame heightClass="h-[200px]">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} days`, ""]}
                  wrapperStyle={tooltipWrapper}
                  contentStyle={{
                    background: "#0b0e0f",
                    border: "1px solid rgba(255,214,10,0.3)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#ffffff",
                  }}
                  itemStyle={{ color: GOLD_BRIGHT }}
                  labelStyle={{ color: MUTED }}
                />
              </PieChart>
            </ChartFrame>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-win-bright">
                {stats.dayWinRate.toFixed(1)}%
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Win rate
              </p>
            </div>
          </>
        )}
      </div>
      <div className="mt-1 flex justify-center gap-5 text-[13px] text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-win" /> Wins {stats.winningDays}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-red" /> Losses {stats.losingDays}
        </span>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-muted">
      No chart data yet.
    </div>
  );
}
