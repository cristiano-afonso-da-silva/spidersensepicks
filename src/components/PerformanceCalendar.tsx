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
import { formatSigned, round2, unitsFromPick } from "@/lib/stats";

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

function cellTone(units: number, maxAbs: number): string {
  if (units === 0) return "bg-white/[0.03] text-foreground";
  const intensity = maxAbs === 0 ? 0.35 : Math.min(0.72, 0.22 + (Math.abs(units) / maxAbs) * 0.5);
  if (units > 0) {
    return intensity > 0.45
      ? "bg-gold/35 text-gold-bright"
      : "bg-gold/18 text-gold-bright";
  }
  return intensity > 0.45
    ? "bg-brand-red/40 text-red-bright"
    : "bg-brand-red/20 text-red-bright";
}

export function PerformanceCalendar({ picks }: { picks: Pick[] }) {
  const dayMap = useMemo(() => buildDayMap(picks), [picks]);

  const latestWithData = useMemo(() => {
    const dates = Array.from(dayMap.keys()).sort();
    return dates.length ? parseISO(dates[dates.length - 1]) : new Date();
  }, [dayMap]);

  const [cursor, setCursor] = useState(() => startOfMonth(latestWithData));

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
        const key = format(d, "yyyy-MM-dd");
        const stat = dayMap.get(key);
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
    for (const [date, stat] of dayMap) {
      const d = parseISO(date);
      if (!isSameMonth(d, monthStart)) continue;
      units = round2(units + stat.units);
      activeDays += 1;
      picksCount += stat.picks;
    }
    return { units, activeDays, picksCount };
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

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-6 sm:px-7">
        <p className="section-label">Month at a glance</p>
        <h2 className="section-title">Performance Calendar</h2>
        <p className="section-copy">
          Daily units, pick volume, and hit rate — gold for winning days, red for
          losing days.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => startOfMonth(subMonths(c, 1)))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-gold transition hover:bg-gold/10"
            aria-label="Previous month"
          >
            ‹
          </button>
          <p className="min-w-[9.5rem] text-center font-[family-name:var(--font-display)] text-xl text-gold-bright">
            {format(cursor, "MMMM yyyy")}
          </p>
          <button
            type="button"
            onClick={() => setCursor((c) => startOfMonth(addMonths(c, 1)))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-gold transition hover:bg-gold/10"
            aria-label="Next month"
          >
            ›
          </button>
          {!isCurrentMonth ? (
            <button
              type="button"
              onClick={() => setCursor(startOfMonth(new Date()))}
              className="ml-1 rounded-lg border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted transition hover:border-gold/40 hover:text-gold-bright"
            >
              This month
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 font-[family-name:var(--font-mono)] text-sm">
          <span
            className={
              monthStats.units >= 0 ? "text-gold-bright" : "text-red-bright"
            }
          >
            {formatSigned(monthStats.units)}u
          </span>
          <span className="text-muted">
            {monthStats.activeDays} day{monthStats.activeDays === 1 ? "" : "s"}
          </span>
          <span className="text-muted">
            {monthStats.picksCount} pick{monthStats.picksCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-2 hidden grid-cols-[repeat(7,minmax(0,1fr))_5.5rem] gap-2 sm:grid">
          {weekdayLabels.map((d) => (
            <div
              key={d}
              className="px-1 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
            >
              {d}
            </div>
          ))}
          <div className="px-1 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Week
          </div>
        </div>

        <div className="space-y-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="space-y-2 sm:space-y-0">
              <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(7,minmax(0,1fr))_5.5rem] sm:gap-2">
                {week.days.map((day) => {
                  const inMonth = isSameMonth(day, monthStart);
                  const key = format(day, "yyyy-MM-dd");
                  const stat = inMonth ? dayMap.get(key) : undefined;

                  if (!inMonth) {
                    return (
                      <div
                        key={key}
                        className="min-h-[4.5rem] rounded-xl border border-transparent bg-transparent sm:min-h-[6.25rem]"
                      />
                    );
                  }

                  if (!stat) {
                    return (
                      <div
                        key={key}
                        className="relative min-h-[4.5rem] rounded-xl border border-border/50 bg-black/20 sm:min-h-[6.25rem]"
                      >
                        <span className="absolute right-2 top-1.5 text-[11px] text-muted/70">
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={key}
                      className={`relative flex min-h-[4.5rem] flex-col justify-end rounded-xl border border-border/40 p-2 sm:min-h-[6.25rem] sm:p-2.5 ${cellTone(stat.units, maxAbs)}`}
                    >
                      <span className="absolute right-2 top-1.5 text-[11px] text-foreground/80">
                        {format(day, "d")}
                      </span>
                      <p className="font-[family-name:var(--font-mono)] text-[0.95rem] font-medium leading-none sm:text-[1.05rem]">
                        {formatSigned(stat.units)}u
                      </p>
                      <p className="mt-1 text-[10px] leading-tight text-foreground/70 sm:text-[11px]">
                        {stat.picks} pick{stat.picks === 1 ? "" : "s"}
                      </p>
                      <p className="text-[10px] leading-tight text-foreground/70 sm:text-[11px]">
                        {stat.winRate.toFixed(0)}%
                      </p>
                    </div>
                  );
                })}

                <div className="hidden min-h-[6.25rem] flex-col justify-center rounded-xl border border-border/60 bg-black/30 px-2 py-2 sm:flex">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    W{wi + 1}
                  </p>
                  <p
                    className={`mt-1 font-[family-name:var(--font-mono)] text-sm ${
                      week.units >= 0 ? "text-gold-bright" : "text-red-bright"
                    }`}
                  >
                    {week.activeDays ? formatSigned(week.units) + "u" : "—"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {week.activeDays
                      ? `${week.activeDays} day${week.activeDays === 1 ? "" : "s"}`
                      : "idle"}
                  </p>
                </div>
              </div>

              {week.activeDays > 0 ? (
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-black/25 px-3 py-2 sm:hidden">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    Week {wi + 1}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-sm">
                    <span
                      className={
                        week.units >= 0 ? "text-gold-bright" : "text-red-bright"
                      }
                    >
                      {formatSigned(week.units)}u
                    </span>
                    <span className="ml-2 text-muted">
                      · {week.activeDays}d
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
