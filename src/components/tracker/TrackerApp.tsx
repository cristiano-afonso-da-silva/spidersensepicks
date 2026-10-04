"use client";

import { useMemo, useState } from "react";
import type { Pick } from "@/lib/types";
import {
  calculateTrackerMetrics,
  filterPicks,
  normalizePick,
} from "@/lib/tracker-metrics";
import { BreakdownPanel } from "./BreakdownPanel";
import { CumulativeUnitsChart } from "./CumulativeUnitsChart";
import { DailyRecord } from "./DailyRecord";
import { Methodology } from "./Methodology";
import { PickHistory, type OutcomeFilter } from "./PickHistory";
import { SummaryCards } from "./SummaryCards";
import { TrackerFilters } from "./TrackerFilters";
import { TrackerHeader } from "./TrackerHeader";
import { buildCsv, downloadCsv } from "./csv";
import {
  DEFAULT_FILTERS,
  presetLabel,
  rangeText,
  resolveFilter,
  useFilterState,
  type FilterState,
} from "./filter-state";

export function TrackerApp({
  picks: rawPicks,
  updatedAt,
}: {
  picks: Pick[];
  updatedAt: string;
}) {
  const all = useMemo(() => rawPicks.map(normalizePick), [rawPicks]);
  const sports = useMemo(
    () => Array.from(new Set(all.map((p) => p.sport))).sort((a, b) => a.localeCompare(b)),
    [all],
  );
  const dates = useMemo(() => all.map((p) => p.date).sort(), [all]);
  const dataFirst = dates[0] ?? null;
  const dataLast = dates[dates.length - 1] ?? null;

  const [filters, writeFilters] = useFilterState(sports);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");
  const [page, setPage] = useState(0);

  const filter = resolveFilter(filters);
  const { from, to, sport } = filter;
  const picks = filterPicks(all, filter);
  const metrics = calculateTrackerMetrics(picks, from);

  const rangeFrom = from ?? metrics.firstDate;
  const rangeTo = to ?? metrics.lastDate;
  const activeRange = rangeText(filter, metrics.firstDate, metrics.lastDate);
  const activeDate =
    selectedDate && picks.some((p) => p.date === selectedDate) ? selectedDate : null;

  const setFilters = (next: FilterState) => {
    writeFilters(next);
    setSelectedDate(null);
    setVisibleMonth(null);
    setPage(0);
  };

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
    setOutcome("all");
  };

  const exportCsv = () => {
    const csv = buildCsv({
      picks,
      metrics,
      rangeText: activeRange,
      periodLabel: presetLabel(filters.preset),
      sport,
      generatedAt: new Date().toISOString(),
    });
    const slug = sport ? `-${sport.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "";
    downloadCsv(
      `ssp-results-${rangeFrom ?? "all"}_${rangeTo ?? "all"}${slug}.csv`,
      csv,
    );
  };

  return (
    <main className="mx-auto max-w-[1180px] space-y-5 px-4 py-5 sm:px-6 sm:py-8">
      <TrackerHeader updatedAt={updatedAt} lastDate={dataLast} />

      <TrackerFilters
        filters={filters}
        sports={sports}
        minDate={dataFirst}
        maxDate={dataLast}
        activeRange={activeRange}
        onChange={setFilters}
        onReset={reset}
        onExport={exportCsv}
        exportDisabled={picks.length === 0}
      />

      <SummaryCards metrics={metrics} />

      <CumulativeUnitsChart series={metrics.series} rangeLabel={activeRange} />

      <DailyRecord
        days={metrics.days}
        picks={picks}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        visibleMonth={visibleMonth}
        onMonthChange={setVisibleMonth}
        selectedDate={activeDate}
        onSelectDate={(d) => {
          setSelectedDate(d);
          setPage(0);
        }}
      />

      <PickHistory
        picks={picks}
        selectedDate={activeDate}
        onClearDate={() => setSelectedDate(null)}
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(0);
        }}
        outcome={outcome}
        onOutcome={(v) => {
          setOutcome(v);
          setPage(0);
        }}
        page={page}
        onPage={setPage}
      />

      <BreakdownPanel metrics={metrics} />
      <Methodology />

      <footer className="flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
        <span>Spider Sense Picks · Results Tracker</span>
        <span>A record of posted picks, not a guarantee of future results.</span>
      </footer>
    </main>
  );
}
