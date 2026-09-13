"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import type { Pick } from "@/lib/types";
import { formatMoney, formatSigned, round2, unitsFromPick } from "@/lib/stats";

type DayStat = {
  date: string;
  units: number;
  picks: number;
  wins: number;
  losses: number;
  winRate: number;
};

type WeekRow = {
  days: Date[];
  units: number;
  activeDays: number;
};

type ViewMode = "month" | "season";

function buildDayMap(picks: Pick[]): Map<string, DayStat> {
  const map = new Map<string, DayStat>();
  for (const p of picks) {
    if (p.result === "pending") continue;
    const prev = map.get(p.date) ?? {
      date: p.date,
      units: 0,
      picks: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    };
    prev.picks += 1;
    prev.units = round2(prev.units + unitsFromPick(p.odds, p.units, p.result));
    if (p.result === "win") prev.wins += 1;
    if (p.result === "loss") prev.losses += 1;
    const decided = prev.wins + prev.losses;
    prev.winRate = decided === 0 ? 0 : round2((prev.wins / decided) * 100);
    map.set(p.date, prev);
  }
  return map;
}

function cellClasses(units: number, maxAbs: number, mobile = false): string {
  if (units === 0) {
    return mobile
      ? "border-border/60 bg-surface-2 text-muted"
      : "border-border/50 bg-surface-2/80 text-muted";
  }
  const big = maxAbs > 0 && Math.abs(units) / maxAbs >= 0.55;
  if (units > 0) {
    return big
      ? "border-gold/50 bg-gold text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
      : "border-gold/35 bg-[var(--win-bg)] text-gold-bright";
  }
  return big
    ? "border-red-bright/40 bg-brand-red text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
    : "border-brand-red/30 bg-[var(--loss-bg)] text-red-bright";
}

export function PerformanceCalendar({ picks }: { picks: Pick[] }) {
  const dayMap = useMemo(() => buildDayMap(picks), [picks]);

  const seasonStats = useMemo(() => {
    let units = 0;
    let activeDays = 0;
    let picksCount = 0;
    let wins = 0;
    let losses = 0;
    for (const stat of dayMap.values()) {
      units = round2(units + stat.units);
      activeDays += 1;
      picksCount += stat.picks;
      wins += stat.wins;
      losses += stat.losses;
    }
    const decided = wins + losses;
    return {
      units,
      activeDays,
      picksCount,
      winRate: decided === 0 ? 0 : round2((wins / decided) * 100),
    };
  }, [dayMap]);

  const latestWithData = useMemo(() => {
    const dates = Array.from(dayMap.keys()).sort();
    return dates.length ? parseISO(dates[dates.length - 1]) : new Date();
  }, [dayMap]);

  const [cursor, setCursor] = useState(() => startOfMonth(latestWithData));
  const [view, setView] = useState<ViewMode>("month");

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weeks = useMemo(() => {
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const rows: WeekRow[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const slice = allDays.slice(i, i + 7);
      let units = 0;
      let activeDays = 0;
      for (const d of slice) {
        if (!isSameMonth(d, monthStart)) continue;
        const stat = dayMap.get(format(d, "yyyy-MM-dd"));
        if (stat) {
          units = round2(units + stat.units);
          activeDays += 1;
        }
      }
      rows.push({ days: slice, units, activeDays });
    }
    return rows;
  }, [dayMap, gridStart, gridEnd, monthStart]);

  const monthStats = useMemo(() => {
    let units = 0;
    let activeDays = 0;
    let picksCount = 0;
    let wins = 0;
    let losses = 0;
    for (const [date, stat] of dayMap) {
      if (!isSameMonth(parseISO(date), monthStart)) continue;
      units = round2(units + stat.units);
      activeDays += 1;
      picksCount += stat.picks;
      wins += stat.wins;
      losses += stat.losses;
    }
    const decided = wins + losses;
    return {
      units,
      activeDays,
      picksCount,
      winRate: decided === 0 ? 0 : round2((wins / decided) * 100),
    };
  }, [dayMap, monthStart]);

  const maxAbs = useMemo(() => {
    let max = 0;
    for (const [date, stat] of dayMap) {
      if (!isSameMonth(parseISO(date), monthStart)) continue;
      max = Math.max(max, Math.abs(stat.units));
    }
    return max || 1;
  }, [dayMap, monthStart]);

  const isCurrentMonth = isSameMonth(cursor, new Date());
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const summary = view === "month" ? monthStats : seasonStats;
  const pnlLabel = view === "month" ? "Month P&L" : "Season P&L";

  return (
    <div className="panel overflow-hidden">
      {/* Desktop header */}
      <div className="hidden border-b border-border px-7 py-6 sm:block">
        <p className="section-label">Month at a glance</p>
        <h2 className="section-title">Performance Calendar</h2>
        <p className="section-copy">
          Daily units at a glance — gold for winning days, red for losing days.
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {/* Period toggle — mobile-first, like reference app */}
        <div className="mb-4 flex rounded-xl bg-surface-2 p-1 sm:mb-5 sm:max-w-xs">
          {(["month", "season"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`flex-1 rounded-lg py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition sm:text-xs ${
                view === mode
                  ? "bg-gold text-black shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {mode === "month" ? "Month" : "Season"}
            </button>
          ))}
        </div>

        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => startOfMonth(subMonths(c, 1)))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-xl text-gold transition hover:border-gold/50 hover:bg-surface-3"
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="font-[family-name:var(--font-display)] text-[1.35rem] leading-tight text-foreground sm:text-xl">
              {format(cursor, "MMMM yyyy")}
            </p>
            {!isCurrentMonth ? (
              <button
                type="button"
                onClick={() => setCursor(startOfMonth(new Date()))}
                className="mt-1 text-[11px] uppercase tracking-[0.12em] text-gold hover:text-gold-bright"
              >
                Jump to this month
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setCursor((c) => startOfMonth(addMonths(c, 1)))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-xl text-gold transition hover:border-gold/50 hover:bg-surface-3"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        {/* P&L summary cards */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface-2 px-4 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {pnlLabel}
            </p>
            <p
              className={`mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,7vw,2.25rem)] leading-none tracking-tight ${
                summary.units >= 0 ? "text-gold-bright" : "text-red-bright"
              }`}
            >
              {formatSigned(summary.units)}u
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xs text-muted">
              {formatMoney(summary.units * 100)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-2 px-4 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              {view === "month" ? "Month Stats" : "Season Stats"}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,7vw,2.25rem)] leading-none tracking-tight text-foreground">
              {summary.winRate.toFixed(0)}%
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {summary.activeDays} day{summary.activeDays === 1 ? "" : "s"} ·{" "}
              {summary.picksCount} pick{summary.picksCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="mb-2 grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(7,minmax(0,1fr))_5.5rem] sm:gap-2">
          {weekdayLabels.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {d.slice(0, 1)}
              <span className="hidden sm:inline">{d.slice(1)}</span>
            </div>
          ))}
          <div className="hidden px-1 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-muted sm:block">
            Week
          </div>
        </div>

        {/* Calendar grid */}
        <div className="space-y-1.5 sm:space-y-2">
          {weeks.map((week, wi) => (
            <div key={wi}>
              <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(7,minmax(0,1fr))_5.5rem] sm:gap-2">
                {week.days.map((day) => {
                  const inMonth = isSameMonth(day, monthStart);
                  const key = format(day, "yyyy-MM-dd");
                  const stat = inMonth ? dayMap.get(key) : undefined;

                  if (!inMonth) {
                    return (
                      <div
                        key={key}
                        className="aspect-square min-h-[3.4rem] rounded-xl sm:min-h-[5.5rem]"
                      />
                    );
                  }

                  if (!stat) {
                    return (
                      <div
                        key={key}
                        className="relative flex aspect-square min-h-[3.4rem] flex-col rounded-xl border border-border/40 bg-surface-2/60 sm:min-h-[5.5rem]"
                      >
                        <span className="absolute left-1.5 top-1 text-[10px] font-medium text-muted/80 sm:left-2 sm:top-1.5 sm:text-[11px]">
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  }

                  const tone = cellClasses(stat.units, maxAbs, true);
                  return (
                    <div
                      key={key}
                      className={`relative flex aspect-square min-h-[3.4rem] flex-col items-center justify-center rounded-xl border p-1 sm:min-h-[5.5rem] sm:p-2 ${tone}`}
                    >
                      <span
                        className={`absolute left-1.5 top-1 text-[10px] font-semibold sm:left-2 sm:top-1.5 sm:text-[11px] ${
                          stat.units > 0 && Math.abs(stat.units) / maxAbs >= 0.55
                            ? "text-black/70"
                            : stat.units < 0 &&
                                Math.abs(stat.units) / maxAbs >= 0.55
                              ? "text-white/80"
                              : "text-foreground/70"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      <p className="font-[family-name:var(--font-mono)] text-[0.72rem] font-bold leading-none sm:text-[0.95rem]">
                        {formatSigned(stat.units)}
                      </p>
                      <p className="mt-0.5 hidden text-[10px] opacity-80 sm:block">
                        {stat.picks}p · {stat.winRate.toFixed(0)}%
                      </p>
                    </div>
                  );
                })}

                <div className="hidden min-h-[5.5rem] flex-col justify-center rounded-xl border border-border bg-surface-2 px-2 py-2 sm:flex">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    W{wi + 1}
                  </p>
                  <p
                    className={`mt-1 font-[family-name:var(--font-mono)] text-sm font-medium ${
                      week.units >= 0 ? "text-gold-bright" : "text-red-bright"
                    }`}
                  >
                    {week.activeDays ? formatSigned(week.units) + "u" : "—"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {week.activeDays
                      ? `${week.activeDays}d`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
