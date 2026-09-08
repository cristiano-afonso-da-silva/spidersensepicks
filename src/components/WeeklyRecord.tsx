"use client";

import { useMemo, useState } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import type { Pick, SeasonStats } from "@/lib/types";
import { formatSigned, unitsFromPick } from "@/lib/stats";

function weekStartKey(dateStr: string): string {
  return format(startOfWeek(parseISO(dateStr), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function WeeklyRecord({
  stats,
  picks,
}: {
  stats: SeasonStats;
  picks: Pick[];
}) {
  const [openWeek, setOpenWeek] = useState<string | null>(null);

  const picksByWeek = useMemo(() => {
    const map = new Map<string, Pick[]>();
    for (const p of picks) {
      const key = weekStartKey(p.date);
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        return b.units - a.units;
      });
    }
    return map;
  }, [picks]);

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-6 sm:px-7">
        <p className="section-label">Full pick ledger</p>
        <h2 className="section-title">All Records</h2>
        <p className="section-copy">
          Tap a date to expand its picks
          {stats.weeksTracked ? ` — ${stats.weeksTracked} weeks tracked` : ""}.
        </p>
      </div>

      <div className="ledger-scroll max-h-[560px] overflow-y-auto">
        {stats.weekly.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            No settled weeks yet.
          </p>
        ) : (
          <ul>
            {stats.weekly.map((w) => {
              const open = openWeek === w.weekStart;
              const weekPicks = picksByWeek.get(w.weekStart) ?? [];
              return (
                <li key={w.weekStart} className="border-t border-border">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenWeek((prev) =>
                        prev === w.weekStart ? null : w.weekStart,
                      )
                    }
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gold/[0.04] sm:px-7"
                    aria-expanded={open}
                  >
                    <span
                      className={`text-gold transition duration-200 ${open ? "rotate-90" : ""}`}
                      aria-hidden
                    >
                      ▸
                    </span>
                    <span className="min-w-[3.5rem] font-[family-name:var(--font-mono)] text-foreground">
                      {w.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                        w.result === "WIN"
                          ? "bg-gold text-black"
                          : w.result === "LOSS"
                            ? "bg-brand-red text-white"
                            : "bg-white/10 text-muted"
                      }`}
                    >
                      {w.result}
                    </span>
                    <span className="ml-auto flex items-center gap-4 font-[family-name:var(--font-mono)] text-sm sm:gap-8">
                      <span
                        className={
                          w.units >= 0 ? "text-gold-bright" : "text-red-bright"
                        }
                      >
                        {formatSigned(w.units)}u
                      </span>
                      <span
                        className={`min-w-[4.5rem] text-right ${
                          w.cumulative >= 0
                            ? "text-gold-bright"
                            : "text-red-bright"
                        }`}
                      >
                        {formatSigned(w.cumulative)}
                      </span>
                    </span>
                  </button>

                  {open ? (
                    <div className="border-t border-border/60 bg-black/30 px-5 py-4 sm:px-7">
                      {weekPicks.length === 0 ? (
                        <p className="py-2 text-sm text-muted">
                          No picks stored for this week.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {weekPicks.map((p) => {
                            const pl =
                              p.result === "pending"
                                ? null
                                : unitsFromPick(p.odds, p.units, p.result);
                            return (
                              <li
                                key={p.id}
                                className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 rounded-lg border border-border/70 bg-surface px-3 py-2.5 sm:grid-cols-[4.5rem_1fr_auto_auto_auto] sm:items-center"
                              >
                                <span className="font-[family-name:var(--font-mono)] text-xs text-muted">
                                  {format(parseISO(p.date), "M/d")}
                                </span>
                                <div className="col-span-2 sm:col-span-1">
                                  <p className="text-sm text-foreground">{p.pick}</p>
                                  <p className="text-[11px] text-muted">
                                    {[p.sport, p.notes]
                                      .filter(Boolean)
                                      .join(" · ")}
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
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
