"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
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

type Period = "week" | "month" | "all";

const WEEKDAYS_MOBILE = ["MON", "TUE", "WED", "THU", "FRI"] as const;

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

function isWeekday(d: Date) {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <rect x="1.5" y="2.5" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
      <path d="M1.5 5h9" stroke="currentColor" strokeWidth="1" />
      <path d="M4 1.5v2M8 1.5v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function aggregateStats(
  dayMap: Map<string, DayStat>,
  filter: (date: string) => boolean,
) {
  let units = 0;
  let activeDays = 0;
  let picksCount = 0;
  let wins = 0;
  let losses = 0;
  for (const [date, stat] of dayMap) {
    if (!filter(date)) continue;
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
}

export function PerformanceCalendar({
  picks,
  variant = "both",
}: {
  picks: Pick[];
  variant?: "mobile" | "desktop" | "both";
}) {
  const dayMap = useMemo(() => buildDayMap(picks), [picks]);

  const latestWithData = useMemo(() => {
    const dates = Array.from(dayMap.keys()).sort();
    return dates.length ? parseISO(dates[dates.length - 1]) : new Date();
  }, [dayMap]);

  const [cursor, setCursor] = useState(() => startOfMonth(latestWithData));
  const [period, setPeriod] = useState<Period>("month");

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });

  const gridStart =
    period === "week"
      ? startOfWeek(weekStart, { weekStartsOn: 1 })
      : startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd =
    period === "week"
      ? endOfWeek(weekEnd, { weekStartsOn: 1 })
      : endOfWeek(monthEnd, { weekStartsOn: 0 });

  const allSeason = useMemo(
    () => aggregateStats(dayMap, () => true),
    [dayMap],
  );

  const monthStats = useMemo(
    () =>
      aggregateStats(dayMap, (date) =>
        isSameMonth(parseISO(date), monthStart),
      ),
    [dayMap, monthStart],
  );

  const weekStats = useMemo(
    () =>
      aggregateStats(dayMap, (date) =>
        isSameWeek(parseISO(date), weekStart, { weekStartsOn: 1 }),
      ),
    [dayMap, weekStart],
  );

  const summary =
    period === "all"
      ? allSeason
      : period === "week"
        ? weekStats
        : monthStats;

  const weeks = useMemo(() => {
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const rows: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }
    if (period === "week") return [rows.find((r) => r.some((d) => isSameWeek(d, weekStart, { weekStartsOn: 1 }))) ?? rows[0]];
    return rows;
  }, [gridStart, gridEnd, period, weekStart]);

  const pnlLabel =
    period === "all" ? "Total P&L" : period === "week" ? "Week P&L" : "Total P&L";

  const navLabel =
    period === "week"
      ? `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
      : format(cursor, "MMMM yyyy");

  function prev() {
    if (period === "week") setCursor((c) => subWeeks(c, 1));
    else setCursor((c) => startOfMonth(subMonths(c, 1)));
  }

  function next() {
    if (period === "week") setCursor((c) => addWeeks(c, 1));
    else setCursor((c) => startOfMonth(addMonths(c, 1)));
  }

  return (
    <>
      {(variant === "mobile" || variant === "both") && (
      <div className="min-h-[100dvh] bg-black px-4 pb-8 pt-6 sm:hidden">
        {/* Period tabs */}
        <div className="mb-5 flex rounded-2xl bg-surface p-1">
          {(
            [
              ["week", "Week"],
              ["month", "Month"],
              ["all", "All time"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                period === key
                  ? "bg-win text-black"
                  : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date nav */}
        {period !== "all" ? (
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={prev}
              className="flex h-9 w-9 items-center justify-center text-xl text-muted"
              aria-label="Previous"
            >
              ‹
            </button>
            <p className="font-[family-name:var(--font-display)] text-lg text-white">
              {navLabel}
            </p>
            <button
              type="button"
              onClick={next}
              className="flex h-9 w-9 items-center justify-center text-xl text-muted"
              aria-label="Next"
            >
              ›
            </button>
          </div>
        ) : (
          <p className="mb-5 text-center font-[family-name:var(--font-display)] text-lg text-white">
            All Time
          </p>
        )}

        {/* P&L cards */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface px-4 py-4">
            <p className="text-xs text-muted">{pnlLabel}</p>
            <p
              className={`mt-2 font-[family-name:var(--font-mono)] text-[1.65rem] font-semibold leading-none ${
                summary.units >= 0 ? "text-win-bright" : "text-red-bright"
              }`}
            >
              {formatMoney(summary.units * 100)}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {formatSigned(summary.units)}u
            </p>
          </div>
          <div className="rounded-2xl bg-surface px-4 py-4">
            <p className="text-xs text-muted">Win rate</p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-[1.65rem] font-semibold leading-none text-white">
              {summary.winRate.toFixed(0)}%
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-win"
                style={{ width: `${Math.min(100, summary.winRate)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              {summary.activeDays} days · {summary.picksCount} picks
            </p>
          </div>
        </div>

        <p className="mb-4 text-center text-sm text-white">
          Spider Sense Picks
        </p>

        {/* Calendar — weekdays only */}
        {period !== "all" ? (
          <>
            <div className="mb-2 grid grid-cols-5 gap-2">
              {WEEKDAYS_MOBILE.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium tracking-wide text-muted"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-5 gap-2">
                  {week
                    .filter(isWeekday)
                    .map((day) => {
                      const inScope =
                        period === "week"
                          ? isSameWeek(day, weekStart, { weekStartsOn: 1 })
                          : isSameMonth(day, monthStart);
                      const key = format(day, "yyyy-MM-dd");
                      const stat = inScope ? dayMap.get(key) : undefined;

                      if (!inScope) {
                        return (
                          <div
                            key={key}
                            className="flex aspect-square items-center justify-center rounded-2xl bg-surface"
                          />
                        );
                      }

                      if (!stat) {
                        return (
                          <div
                            key={key}
                            className="relative flex aspect-square flex-col items-center justify-center rounded-2xl bg-surface"
                          >
                            <span className="absolute left-2 top-2 flex items-center gap-0.5 text-[10px] text-muted">
                              <CalendarIcon className="h-2.5 w-2.5" />
                              {format(day, "d")}
                            </span>
                            <span className="text-sm text-muted">—</span>
                          </div>
                        );
                      }

                      const positive = stat.units > 0;
                      const negative = stat.units < 0;
                      return (
                        <div
                          key={key}
                          className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl ${
                            positive
                              ? "bg-win text-white"
                              : negative
                                ? "bg-brand-red text-white"
                                : "bg-surface text-muted"
                          }`}
                        >
                          <span className="absolute left-2 top-2 flex items-center gap-0.5 text-[10px] opacity-80">
                            <CalendarIcon className="h-2.5 w-2.5" />
                            {format(day, "d")}
                          </span>
                          <p className="font-[family-name:var(--font-mono)] text-[0.8rem] font-semibold leading-none">
                            {formatSigned(stat.units)}
                          </p>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
      )}

      {(variant === "desktop" || variant === "both") && (
      <div className="panel hidden overflow-hidden sm:block">
        <div className="border-b border-border px-7 py-6">
          <p className="section-label">Month at a glance</p>
          <h2 className="section-title">Performance Calendar</h2>
          <p className="section-copy">
            Green for winning days, red for losing days.
          </p>
        </div>

        <div className="p-6">
          <div className="mb-5 flex max-w-sm rounded-xl bg-surface-2 p-1">
            {(
              [
                ["week", "Week"],
                ["month", "Month"],
                ["all", "All time"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  period === key
                    ? "bg-win text-black"
                    : "text-muted hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {period !== "all" ? (
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
              >
                ‹
              </button>
              <p className="font-[family-name:var(--font-display)] text-xl text-white">
                {navLabel}
              </p>
              <button
                type="button"
                onClick={next}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
              >
                ›
              </button>
            </div>
          ) : null}

          <div className="mb-6 grid grid-cols-2 gap-4 max-w-lg">
            <div className="rounded-2xl border border-border bg-surface-2 px-5 py-4">
              <p className="text-[10px] uppercase tracking-wider text-muted">
                {pnlLabel}
              </p>
              <p
                className={`mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold ${
                  summary.units >= 0 ? "text-win-bright" : "text-red-bright"
                }`}
              >
                {formatSigned(summary.units)}u
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatMoney(summary.units * 100)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 px-5 py-4">
              <p className="text-[10px] uppercase tracking-wider text-muted">
                Win rate
              </p>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold text-white">
                {summary.winRate.toFixed(0)}%
              </p>
              <p className="mt-1 text-xs text-muted">
                {summary.activeDays} days · {summary.picksCount} picks
              </p>
            </div>
          </div>

          {period !== "all" ? (
            <>
              <div className="mb-2 grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-medium uppercase tracking-wider text-muted"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-2">
                    {week.map((day) => {
                      const inScope =
                        period === "week"
                          ? isSameWeek(day, weekStart, { weekStartsOn: 1 })
                          : isSameMonth(day, monthStart);
                      const key = format(day, "yyyy-MM-dd");
                      const stat = inScope ? dayMap.get(key) : undefined;

                      if (!inScope) {
                        return <div key={key} className="min-h-[5rem]" />;
                      }

                      if (!stat) {
                        return (
                          <div
                            key={key}
                            className="relative flex min-h-[5rem] flex-col justify-end rounded-xl border border-border/40 bg-surface-2 p-2"
                          >
                            <span className="absolute right-2 top-2 text-[11px] text-muted">
                              {format(day, "d")}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={key}
                          className={`relative flex min-h-[5rem] flex-col justify-end rounded-xl p-2 ${
                            stat.units > 0
                              ? "bg-win text-black"
                              : stat.units < 0
                                ? "bg-brand-red text-white"
                                : "bg-surface-2 text-muted"
                          }`}
                        >
                          <span className="absolute right-2 top-2 text-[11px] opacity-70">
                            {format(day, "d")}
                          </span>
                          <p className="font-[family-name:var(--font-mono)] text-sm font-semibold">
                            {formatSigned(stat.units)}u
                          </p>
                          <p className="text-[10px] opacity-80">
                            {stat.picks}p · {stat.winRate.toFixed(0)}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
      )}
    </>
  );
}
