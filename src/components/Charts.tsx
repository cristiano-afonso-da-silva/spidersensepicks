"use client";

import { useEffect, useState, type ReactNode } from "react";
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

const GOLD = "#d4af69";
const GOLD_BRIGHT = "#efd39a";
const RED = "#d41828";
const MUTED = "#8f8a84";
const GRID = "rgba(212, 175, 105, 0.12)";

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
    <div className="rounded-lg border border-border bg-[#0b0b0b] px-3 py-2 text-xs shadow-xl">
      <p className="text-muted">{label}</p>
      <p className="mt-0.5 font-medium text-gold-bright">
        {formatSigned(value)}
        {suffix}
      </p>
    </div>
  );
}

const tooltipWrapper = { outline: "none", zIndex: 20 } as const;
const darkCursorBar = {
  fill: "rgba(212, 24, 40, 0.12)",
  stroke: "transparent",
} as const;
const darkCursorLine = {
  stroke: "rgba(212, 175, 105, 0.5)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
} as const;

function SectionHead({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="mb-5 max-w-2xl">
      <h2 className="section-title">{title}</h2>
      <p className="section-copy">{copy}</p>
    </div>
  );
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

export function CumulativeChart({ stats }: { stats: SeasonStats }) {
  const data = stats.cumulativeSeries.map((p) => ({
    ...p,
    value: p.cumulative,
  }));

  return (
    <div className="panel-soft p-6 sm:p-8">
      <SectionHead
        title="Cumulative Unit Curve"
        copy="Running total of units won and lost, with defining moments marked along the way."
      />
      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted sm:h-[340px]">
          No chart data yet.
        </div>
      ) : (
        <ChartFrame heightClass="h-[280px] sm:h-[340px]">
          <AreaChart
            data={data}
            margin={{ top: 36, right: 28, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
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
              domain={[0, "auto"]}
            />
            <Tooltip
              cursor={darkCursorLine}
              wrapperStyle={tooltipWrapper}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload as never}
                  label={`Point ${label}`}
                  suffix="u cumulative"
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={GOLD_BRIGHT}
              strokeWidth={2.6}
              fill="url(#cumFill)"
              dot={{ r: 4, fill: GOLD_BRIGHT, stroke: "#070707", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: GOLD_BRIGHT, stroke: "#070707" }}
            />
            {stats.annotations.map((a) => {
              const point = [...stats.cumulativeSeries]
                .reverse()
                .find((c) => c.date === a.date && c.label !== "Open");
              if (!point) return null;
              return (
                <ReferenceDot
                  key={`peak-${a.date}`}
                  x={point.label}
                  y={a.cumulative}
                  r={3.5}
                  fill={GOLD}
                  stroke="#070707"
                  label={(props) => (
                    <AnnotationLabel
                      viewBox={props.viewBox as { x?: number; y?: number }}
                      text={a.label}
                    />
                  )}
                />
              );
            })}
          </AreaChart>
        </ChartFrame>
      )}
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
        <MetricLine label="Season finish" value={`${formatSigned(stats.netUnits)}u`} />
      </div>
    </div>
  );
}

function AnnotationLabel({
  text,
  viewBox,
}: {
  text: string;
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
}) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;

  return (
    <text
      x={x}
      y={y - 14}
      textAnchor="middle"
      fill={GOLD}
      fontSize={10}
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
    >
      {text}
    </text>
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
    <div className="panel p-6 sm:p-7">
      <SectionHead
        title="Daily Performance"
        copy="Net units day by day — gold above zero, red below."
      />
      {stats.daily.length === 0 ? (
        <EmptyChart />
      ) : (
        <ChartFrame heightClass="h-[220px] sm:h-[260px]">
          <BarChart data={stats.daily}>
            <CartesianGrid stroke={GRID} vertical={false} />
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
                  label={`${label}`}
                />
              )}
            />
            <Bar dataKey="units" radius={[3, 3, 0, 0]}>
              {stats.daily.map((d) => (
                <Cell key={d.date} fill={d.units >= 0 ? GOLD : RED} />
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
            <Bar dataKey="units" radius={[3, 3, 0, 0]}>
              {stats.monthly.map((m) => (
                <Cell key={m.key} fill={m.units >= 0 ? GOLD : RED} />
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
                    background: "#0b0b0b",
                    border: "1px solid rgba(212,175,105,0.35)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#f4f0ea",
                  }}
                  itemStyle={{ color: GOLD_BRIGHT }}
                  labelStyle={{ color: MUTED }}
                />
              </PieChart>
            </ChartFrame>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-[family-name:var(--font-display)] text-3xl text-gold-bright">
                {stats.dayWinRate.toFixed(1)}%
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
          <span className="h-2 w-2 rounded-full bg-gold" /> Wins {stats.winningDays}
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
