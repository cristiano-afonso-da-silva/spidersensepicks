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
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect
        x="1.5"
        y="2.5"
        width="9"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M1.5 5h9" stroke="currentColor" strokeWidth="1" />
      <path
        d="M4 1.5v2M8 1.5v2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
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
        <div className="bg-black px-4 pb-6 pt-6 sm:hidden">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor((c) => startOfMonth(subMonths(c, 1)))}
              className="flex h-9 w-9 items-center justify-center text-xl text-muted"
              aria-label="Previous month"
            >
              ‹
            </button>
            <p className="font-[family-name:var(--font-display)] text-lg text-white">
              {format(cursor, "MMMM yyyy")}
            </p>
            <button
              type="button"
              onClick={() => setCursor((c) => startOfMonth(addMonths(c, 1)))}
              className="flex h-9 w-9 items-center justify-center text-xl text-muted"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

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
                {week.filter(isWeekday).map((day) => {
                  const inMonth = isSameMonth(day, monthStart);
                  const key = format(day, "yyyy-MM-dd");
                  const stat = inMonth ? dayMap.get(key) : undefined;

                  if (!inMonth) {
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
                          ? "bg-win text-black"
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
        </div>
      )}

      {(variant === "desktop" || variant === "both") && (
        <div className="panel hidden overflow-hidden sm:block">
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
              <p className="font-[family-name:var(--font-display)] text-xl text-white">
                {format(cursor, "MMMM yyyy")}
              </p>
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
          </div>
        </div>
      )}
    </>
  );
}
