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

export function WeeklyRecord({
  stats,
  picks,
}: {
  stats: SeasonStats;
  picks: Pick[];
}) {
  const [openDate, setOpenDate] = useState<string | null>(null);

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

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-6 sm:px-7">
        <p className="section-label">Full pick ledger</p>
        <h2 className="section-title">All Records</h2>
        <p className="section-copy">
          Tap a date to expand its picks
          {settledDays ? ` — ${settledDays} days tracked` : ""}.
          {stats.weeksTracked ? ` · ${stats.weeksTracked} weeks` : ""}
        </p>
      </div>

      <div className="ledger-scroll max-h-[560px] overflow-y-auto">
        {days.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            No picks recorded yet.
          </p>
        ) : (
          <>
            <div
              className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-[#0c0c0c]/95 px-5 py-2.5 backdrop-blur-sm sm:px-7"
              role="row"
            >
              <span className="w-4 shrink-0" aria-hidden />
              <span className="min-w-[3.5rem] text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Date
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Result
              </span>
              <span className="ml-auto flex items-center gap-4 sm:gap-8">
                <span className="min-w-[4.25rem] text-right text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  Day
                </span>
                <span className="min-w-[4.5rem] text-right text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  Total
                </span>
              </span>
            </div>
            <ul>
            {days.map((d) => {
              const open = openDate === d.date;
              return (
                <li key={d.date} className="border-t border-border">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDate((prev) => (prev === d.date ? null : d.date))
                    }
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gold/[0.04] sm:px-7"
                    aria-expanded={open}
                  >
                    <span
                      className={`w-4 shrink-0 text-gold transition duration-200 ${open ? "rotate-90" : ""}`}
                      aria-hidden
                    >
                      ▸
                    </span>
                    <span className="min-w-[3.5rem] font-[family-name:var(--font-mono)] text-foreground">
                      {d.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                        d.result === "WIN"
                          ? "bg-gold text-black"
                          : d.result === "LOSS"
                            ? "bg-brand-red text-white"
                            : "bg-white/10 text-muted"
                      }`}
                    >
                      {d.result}
                    </span>
                    <span className="ml-auto flex items-center gap-4 font-[family-name:var(--font-mono)] text-sm sm:gap-8">
                      <span
                        className={`min-w-[4.25rem] text-right ${
                          d.units >= 0 ? "text-gold-bright" : "text-red-bright"
                        }`}
                      >
                        {formatSigned(d.units)}u
                      </span>
                      <span
                        className={`min-w-[4.5rem] text-right ${
                          d.cumulative >= 0
                            ? "text-gold-bright"
                            : "text-red-bright"
                        }`}
                      >
                        {formatSigned(d.cumulative)}u
                      </span>
                    </span>
                  </button>

                  {open ? (
                    <div className="border-t border-border/60 bg-black/30 px-5 py-4 sm:px-7">
                      <ul className="space-y-2">
                        {d.picks.map((p) => {
                          const pl =
                            p.result === "pending"
                              ? null
                              : unitsFromPick(p.odds, p.units, p.result);
                          return (
                            <li
                              key={p.id}
                              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-lg border border-border/70 bg-surface px-3 py-2.5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                            >
                              <div>
                                <p className="text-sm text-foreground">{p.pick}</p>
                                <p className="text-[11px] text-muted">
                                  {[p.sport, p.notes].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                              <span className="font-[family-name:var(--font-mono)] text-xs text-muted">
                                {p.odds > 0 ? `+${p.odds}` : p.odds} · {p.units}u
                              </span>
                              <span
                                className={`justify-self-end rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                  p.result === "win"
                                    ? "bg-gold text-black"
                                    : p.result === "loss"
                                      ? "bg-brand-red text-white"
                                      : "bg-white/10 text-muted"
                                }`}
                              >
                                {p.result}
                              </span>
                              <span
                                className={`justify-self-end font-[family-name:var(--font-mono)] text-sm ${
                                  pl === null
                                    ? "text-muted"
                                    : pl >= 0
                                      ? "text-gold-bright"
                                      : "text-red-bright"
                                }`}
                              >
                                {pl === null ? "—" : formatSigned(pl)}
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
          </>
        )}
      </div>
    </div>
  );
}
