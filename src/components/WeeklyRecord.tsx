"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { Pick, SeasonStats } from "@/lib/types";
import { formatSigned, round2, unitsFromPick } from "@/lib/stats";

type DayRow = {
  date: string;
  label: string;
  units: number;
  cumulative: number;
  result: "WIN" | "LOSS" | "PUSH";
  picks: Pick[];
};

const PAGE_SIZE = 10;

export function WeeklyRecord({
  stats,
  picks,
}: {
  stats: SeasonStats;
  picks: Pick[];
}) {
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const days = useMemo(() => {
    const byDate = new Map<string, Pick[]>();
    for (const p of picks) {
      const list = byDate.get(p.date) ?? [];
      list.push(p);
      byDate.set(p.date, list);
    }

    const dates = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b));
    let running = 0;
    const rows: DayRow[] = [];

    for (const date of dates) {
      const dayPicks = (byDate.get(date) ?? []).slice().sort((a, b) => {
        if (b.units !== a.units) return b.units - a.units;
        return a.pick.localeCompare(b.pick);
      });

      const settled = dayPicks.filter((p) => p.result !== "pending");
      if (settled.length === 0 && dayPicks.every((p) => p.result === "pending")) {
        // still show pending-only days
      }

      const units = round2(
        dayPicks.reduce(
          (sum, p) => sum + unitsFromPick(p.odds, p.units, p.result),
          0,
        ),
      );
      running = round2(running + units);

      rows.push({
        date,
        label: format(parseISO(date), "M/d"),
        units,
        cumulative: running,
        result: units > 0 ? "WIN" : units < 0 ? "LOSS" : "PUSH",
        picks: dayPicks,
      });
    }

    return rows;
  }, [picks]);

  const settledDays = days.filter((d) =>
    d.picks.some((p) => p.result !== "pending"),
  ).length;

  // Newest first — cumulative values were computed oldest → newest above.
  const sortedDays = useMemo(() => [...days].reverse(), [days]);
  const totalPages = Math.max(1, Math.ceil(sortedDays.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageDays = sortedDays.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );
  const rangeStart = sortedDays.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(sortedDays.length, safePage * PAGE_SIZE + PAGE_SIZE);

  function goToPage(next: number) {
    setPage(Math.max(0, Math.min(totalPages - 1, next)));
    setOpenDate(null);
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-6 sm:px-7">
        <p className="section-label">Full pick ledger</p>
        <h2 className="section-title">All Records</h2>
        <p className="section-copy">
          Newest first — tap a date to expand its picks
          {settledDays ? ` · ${settledDays} days tracked` : ""}
          {stats.weeksTracked ? ` · ${stats.weeksTracked} weeks` : ""}
        </p>
      </div>

      <div>
        {days.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            No picks recorded yet.
          </p>
        ) : (
          <>
            <div
              className="flex items-center gap-3 border-b border-border bg-surface/95 px-5 py-2.5 sm:px-7"
              role="row"
            >
              <span className="w-4 shrink-0" aria-hidden />
              <span className="min-w-[3.5rem] text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Date
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Result
              </span>
              <span className="ml-auto flex items-center gap-4 sm:gap-8">
                <span className="min-w-[4.25rem] text-right text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Day
                </span>
                <span className="min-w-[4.5rem] text-right text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Total
                </span>
              </span>
            </div>
            <ul>
            {pageDays.map((d) => {
              const open = openDate === d.date;
              return (
                <li key={d.date} className="border-t border-border">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDate((prev) => (prev === d.date ? null : d.date))
                    }
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03] sm:px-7"
                    aria-expanded={open}
                  >
                    <span
                      className={`w-4 shrink-0 text-muted transition duration-200 ${open ? "rotate-90" : ""}`}
                      aria-hidden
                    >
                      ▸
                    </span>
                    <span className="min-w-[3.5rem] font-semibold tabular-nums text-foreground">
                      {d.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${
                        d.result === "WIN"
                          ? "tile-win"
                          : d.result === "LOSS"
                            ? "tile-loss"
                            : "bg-white/10 text-muted"
                      }`}
                    >
                      {d.result}
                    </span>
                    <span className="ml-auto flex items-center gap-4 font-semibold tabular-nums text-sm sm:gap-8">
                      <span
                        className={`min-w-[4.25rem] text-right ${
                          d.units >= 0 ? "text-win-bright" : "text-red-bright"
                        }`}
                      >
                        {formatSigned(d.units)}u
                      </span>
                      <span
                        className={`min-w-[4.5rem] text-right ${
                          d.cumulative >= 0
                            ? "text-win-bright"
                            : "text-red-bright"
                        }`}
                      >
                        {formatSigned(d.cumulative)}u
                      </span>
                    </span>
                  </button>

                  {open ? (
                    <div className="border-t border-border/60 bg-surface-2/50 px-5 py-4 sm:px-7">
                      <ul className="space-y-2">
                        {d.picks.map((p) => {
                          const pl =
                            p.result === "pending"
                              ? null
                              : unitsFromPick(p.odds, p.units, p.result);
                          return (
                            <li
                              key={p.id}
                              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 rounded-lg border border-border/70 bg-surface px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:items-center"
                            >
                              <p className="text-sm text-foreground">{p.pick}</p>
                              <span className="font-semibold tabular-nums text-[13px] text-muted sm:justify-self-end">
                                {p.odds > 0 ? `+${p.odds}` : p.odds} · {p.units}u
                              </span>
                              {p.sport ? (
                                <span className="justify-self-end rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-muted">
                                  {p.sport}
                                </span>
                              ) : (
                                <span className="hidden sm:block" />
                              )}
                              <span
                                className={`justify-self-end rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                                  p.result === "win"
                                    ? "tile-win"
                                    : p.result === "loss"
                                      ? "tile-loss"
                                      : "bg-white/10 text-muted"
                                }`}
                              >
                                {p.result}
                              </span>
                              <span
                                className={`justify-self-end font-semibold tabular-nums text-sm ${
                                  pl === null
                                    ? "text-muted"
                                    : pl >= 0
                                      ? "text-win-bright"
                                      : "text-red-bright"
                                }`}
                              >
                                {pl === null ? "—" : `${formatSigned(pl)}u`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
            </ul>

            <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-7">
              <p className="text-[13px] font-semibold tabular-nums text-muted">
                {rangeStart}–{rangeEnd} of {sortedDays.length} days
              </p>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-lg text-muted transition hover:text-white disabled:opacity-30"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToPage(i)}
                    className={`h-9 min-w-9 rounded-lg px-2 text-[13px] font-bold tabular-nums transition ${
                      i === safePage
                        ? "bg-win text-black"
                        : "border border-border text-muted hover:text-white"
                    }`}
                    aria-current={i === safePage ? "page" : undefined}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-lg text-muted transition hover:text-white disabled:opacity-30"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
