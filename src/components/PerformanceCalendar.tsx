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

const WEEKDAYS_MOBILE = ["S", "M", "T", "W", "T", "F", "S"] as const;

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

function monthUnitsTotal(
  dayMap: Map<string, DayStat>,
  monthStart: Date,
): number {
  const prefix = format(monthStart, "yyyy-MM");
  let total = 0;
  for (const [date, stat] of dayMap) {
    if (date.startsWith(prefix)) total = round2(total + stat.units);
  }
  return total;
}

/** Compact units for calendar cells — matches reference style (6.47u / -4.25u) */
function formatCellUnits(n: number): string {
  const abs = Math.abs(n).toFixed(2).replace(/\.?0+$/, "");
  if (n < 0) return `-${abs}u`;
  return `${abs}u`;
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

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthUnits = useMemo(
    () => monthUnitsTotal(dayMap, monthStart),
    [dayMap, monthStart],
  );

  const weeks = useMemo(() => {
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const rows: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      rows.push(allDays.slice(i, i + 7));
    }
    return rows;
  }, [gridStart, gridEnd]);

  return (
    <>
      {(variant === "mobile" || variant === "both") && (
        <div className="sm:hidden">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCursor((c) => startOfMonth(subMonths(c, 1)))}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl leading-none text-muted"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="flex min-w-0 flex-1 items-baseline gap-2">
              <p className="truncate text-[1.15rem] font-extrabold leading-none tracking-tight text-white">
                {format(cursor, "MMMM yyyy")}
              </p>
              <span
                className={`shrink-0 text-sm font-bold tabular-nums ${
                  monthUnits > 0
                    ? "text-win"
                    : monthUnits < 0
                      ? "text-[var(--red-soft)]"
                      : "text-muted"
                }`}
              >
                {formatSigned(monthUnits)}u
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCursor((c) => startOfMonth(addMonths(c, 1)))}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl leading-none text-muted"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="mb-1.5 grid grid-cols-7 gap-1.5">
            {WEEKDAYS_MOBILE.map((d, i) => (
              <div
                key={`${d}-${i}`}
                className="text-center text-[11px] font-semibold text-muted"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((day) => {
                  const inMonth = isSameMonth(day, monthStart);
                  const key = format(day, "yyyy-MM-dd");
                  const stat = inMonth ? dayMap.get(key) : undefined;

                  if (!inMonth) {
                    return <div key={key} className="aspect-square" />;
                  }

                  if (!stat) {
                    return (
                      <div
                        key={key}
                        className="tile-empty flex aspect-square flex-col items-center justify-center rounded-[0.7rem] border-none px-0.5"
                      >
                        <span className="text-[14px] font-bold leading-none text-muted/60">
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  }

                  const positive = stat.units > 0;
                  const negative = stat.units < 0;
                  const tileClass = positive
                    ? "tile-win-soft"
                    : negative
                      ? "tile-loss-soft"
                      : "tile-flat-soft";

                  return (
                    <div
                      key={key}
                      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-[0.7rem] px-0.5 ${tileClass}`}
                    >
                      <span className="text-[14px] font-bold leading-none">
                        {format(day, "d")}
                      </span>
                      <p className="text-center text-[12px] font-semibold tabular-nums leading-none tracking-tight">
                        {formatCellUnits(stat.units)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {(variant === "desktop" || variant === "both") && (
        <div className="panel-soft hidden overflow-hidden sm:block">
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCursor((c) => startOfMonth(subMonths(c, 1)))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="flex items-baseline gap-2.5">
                <p className="text-lg font-bold text-white">
                  {format(cursor, "MMMM yyyy")}
                </p>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    monthUnits > 0
                      ? "text-win"
                      : monthUnits < 0
                        ? "text-[var(--red-soft)]"
                        : "text-muted"
                  }`}
                >
                  {formatSigned(monthUnits)}u
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCursor((c) => startOfMonth(addMonths(c, 1)))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-2">
                  {week.map((day) => {
                    const inMonth = isSameMonth(day, monthStart);
                    const key = format(day, "yyyy-MM-dd");
                    const stat = inMonth ? dayMap.get(key) : undefined;

                    if (!inMonth) {
                      return <div key={key} className="min-h-[5rem]" />;
                    }

                    if (!stat) {
                      return (
                        <div
                          key={key}
                          className="tile-empty flex min-h-[5rem] flex-col items-center justify-center rounded-xl border-none p-2"
                        >
                          <span className="text-[14px] font-bold leading-none text-muted/60">
                            {format(day, "d")}
                          </span>
                        </div>
                      );
                    }

                    const tileClass =
                      stat.units > 0
                        ? "tile-win-soft"
                        : stat.units < 0
                          ? "tile-loss-soft"
                          : "tile-flat-soft";

                    return (
                      <div
                        key={key}
                        className={`flex min-h-[5rem] flex-col items-center justify-center gap-1 rounded-xl p-2 ${tileClass}`}
                      >
                        <span className="text-[14px] font-bold leading-none">
                          {format(day, "d")}
                        </span>
                        <p className="text-[12px] font-semibold tabular-nums leading-none">
                          {formatCellUnits(stat.units)}
                        </p>
                        <p className="text-[11px] font-semibold opacity-70">
                          {stat.picks}p · {stat.winRate.toFixed(0)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
