"use client";

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
import type { SeasonStats } from "@/lib/types";
import { formatSigned } from "@/lib/stats";

const RED = "#e11d2e";
const RED_BRIGHT = "#ff2a3d";
const GOLD = "#c5a059";
const BURGUNDY = "#5c1a1a";
const MUTED = "#b09a9a";

function ChartTooltip({
  active,
  payload,
  label,
  valueKey = "value",
  suffix = "u",
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: Record<string, unknown> }>;
  label?: string;
  valueKey?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const value =
    typeof row.value === "number"
      ? row.value
      : typeof row.payload?.[valueKey] === "number"
        ? (row.payload[valueKey] as number)
        : 0;
  return (
    <div className="rounded-lg border border-brand-red/50 bg-[#0a0505] px-3 py-2 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.65)]">
      <p className="text-muted">{label}</p>
      <p className="mt-0.5 font-medium text-gold-bright">
        {formatSigned(value)}
        {suffix}
      </p>
    </div>
  );
}

const tooltipWrapper = {
  outline: "none",
  zIndex: 20,
} as const;

const darkCursorBar = {
  fill: "rgba(225, 29, 46, 0.12)",
  stroke: "transparent",
} as const;

const darkCursorLine = {
  stroke: "rgba(225, 29, 46, 0.55)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
} as const;

export function CumulativeChart({ stats }: { stats: SeasonStats }) {
  const data = stats.cumulativeSeries.map((p) => ({
    ...p,
    value: p.cumulative,
  }));

  return (
    <div className="panel panel-forest p-5 sm:p-7">
      <div className="mb-5 max-w-2xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-red-bright sm:text-3xl">
          Cumulative Unit Curve
        </h2>
        <p className="mt-1 text-sm text-muted">
          Running total of units won and lost across the full season, with the
          season&apos;s defining moments marked along the way.
        </p>
      </div>
      <div className="h-[280px] w-full sm:h-[340px]">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={RED} stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="rgba(225,29,46,0.12)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}u`}
                tick={{ fill: MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                cursor={darkCursorLine}
                wrapperStyle={tooltipWrapper}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload as never}
                    label={`Week of ${label}`}
                    suffix="u cumulative"
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={RED_BRIGHT}
                strokeWidth={2.5}
                fill="url(#cumFill)"
                filter="url(#glow)"
                dot={false}
                activeDot={{ r: 5, fill: GOLD, stroke: "#000" }}
              />
              {stats.annotations.map((a) => (
                <ReferenceDot
                  key={a.date + a.label}
                  x={stats.cumulativeSeries.find((c) => c.date === a.date)?.label}
                  y={a.cumulative}
                  r={4}
                  fill={GOLD}
                  stroke="#000"
                  label={{
                    value: a.label,
                    position: "top",
                    fill: GOLD,
                    fontSize: 10,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-5 grid gap-3 border-t border-border/50 pt-4 sm:grid-cols-3">
        <MetricLine
          label="Peak"
          value={
            stats.peak
              ? `${formatSigned(stats.peak.units)}u week of ${stats.peak.weekLabel}`
              : "—"
          }
        />
        <MetricLine
          label="Largest drawdown"
          value={
            stats.largestDrawdown
              ? `${formatSigned(stats.largestDrawdown.amount)}u ${stats.largestDrawdown.fromLabel} → ${stats.largestDrawdown.toLabel}`
              : "—"
          }
        />
        <MetricLine
          label="Season finish"
          value={`${formatSigned(stats.netUnits)}u`}
        />
      </div>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-gold-bright">
        {value}
      </p>
    </div>
  );
}

export function WeeklyBars({ stats }: { stats: SeasonStats }) {
  return (
    <div className="panel p-5 sm:p-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-red-bright">
        Weekly Performance
      </h2>
      <p className="mt-1 text-sm text-muted">
        Net units, week by week — gold above the line, red below.
      </p>
      <div className="mt-4 h-[220px] w-full sm:h-[260px]">
        {stats.weekly.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weekly}>
              <CartesianGrid stroke="rgba(197,160,89,0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: MUTED, fontSize: 11 }}
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
                    label={`Week of ${label}`}
                  />
                )}
              />
              <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                {stats.weekly.map((w) => (
                  <Cell
                    key={w.weekStart}
                    fill={w.units >= 0 ? GOLD : RED}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function MonthlyBars({ stats }: { stats: SeasonStats }) {
  return (
    <div className="panel p-5 sm:p-6 h-full">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-red-bright">
        Monthly Performance
      </h2>
      <p className="mt-1 text-sm text-muted">Net units by calendar month.</p>
      <div className="mt-4 h-[200px] w-full">
        {stats.monthly.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthly}>
              <CartesianGrid stroke="rgba(197,160,89,0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: MUTED, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: MUTED, fontSize: 11 }}
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
              <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                {stats.monthly.map((m) => (
                  <Cell key={m.key} fill={m.units >= 0 ? GOLD : RED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function WinsLossesDonut({ stats }: { stats: SeasonStats }) {
  const data = [
    { name: "Wins", value: stats.winningWeeks, color: GOLD },
    { name: "Losses", value: stats.losingWeeks, color: RED },
  ].filter((d) => d.value > 0);

  return (
    <div className="panel p-5 sm:p-6 h-full">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-red-bright">
        Wins vs Losses
      </h2>
      <p className="mt-1 text-sm text-muted">Share of weeks by outcome.</p>
      <div className="relative mt-2 h-[200px] w-full">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} weeks`, ""]}
                  wrapperStyle={tooltipWrapper}
                  contentStyle={{
                    background: "#0a0505",
                    border: "1px solid rgba(225,29,46,0.4)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#f7ecec",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.65)",
                  }}
                  itemStyle={{ color: "#e0bf78" }}
                  labelStyle={{ color: "#b09a9a" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-[family-name:var(--font-display)] text-3xl text-red-bright">
                {stats.weekWinRate.toFixed(1)}%
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                Win rate
              </p>
            </div>
          </>
        )}
      </div>
      <div className="mt-1 flex justify-center gap-5 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gold" /> Wins {stats.winningWeeks}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-red" /> Losses{" "}
          {stats.losingWeeks}
        </span>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Log settled picks to populate this chart.
    </div>
  );
}
