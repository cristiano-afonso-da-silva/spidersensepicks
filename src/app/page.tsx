import {
  CumulativeChart,
  MonthlyBars,
  WeeklyBars,
  WinsLossesDonut,
} from "@/components/Charts";
import { HeroStats, HighlightStats } from "@/components/StatBlocks";
import { PerformanceCalendar } from "@/components/PerformanceCalendar";
import { SportAnalysis } from "@/components/SportAnalysis";
import { WeeklyRecord } from "@/components/WeeklyRecord";
import { format, parseISO } from "date-fns";
import { readPicks } from "@/lib/picks-store";
import { computeStats } from "@/lib/stats";
import type { SeasonStats } from "@/lib/types";

function SiteHeader({ stats }: { stats: SeasonStats }) {
  const through = stats.seasonEnd
    ? format(parseISO(stats.seasonEnd), "MMM d, yyyy")
    : null;

  return (
    <header className="pb-2 pt-4 sm:pb-4 sm:pt-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-win sm:text-[13px]">
        Private Performance Report
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div>
          <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[2.5rem]">
            Spider <span className="text-win">Sense</span> Picks
          </h1>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-muted sm:text-[15px]">
            How sharp are the picks? Every pick logged and settled — wins,
            losses and pushes. Updated daily.
          </p>
        </div>
        {through ? (
          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-muted">
            Through {through} · {stats.settledPicks} picks
          </p>
        ) : null}
      </div>
    </header>
  );
}

export default async function HomePage() {
  const picks = await readPicks();
  const stats = computeStats(picks);

  return (
    <main className="sm:py-10">
      {/* Mobile */}
      <div className="space-y-6 px-4 pb-12 pt-5 sm:hidden">
        <SiteHeader stats={stats} />
        <HeroStats stats={stats} />
        <PerformanceCalendar picks={picks} variant="mobile" />
        <CumulativeChart stats={stats} />
        <WeeklyBars stats={stats} />
        <SportAnalysis stats={stats} />
        <WeeklyRecord stats={stats} picks={picks} />
        <footer className="page-footer">
          <span>Spider Sense Picks</span>
          <span>Performance report</span>
        </footer>
      </div>

      {/* Desktop */}
      <div className="shell hidden space-y-10 sm:block">
        <div className="space-y-6">
          <SiteHeader stats={stats} />
          <HeroStats stats={stats} />
        </div>
        <PerformanceCalendar picks={picks} variant="desktop" />
        <CumulativeChart stats={stats} />
        <div className="grid gap-5 lg:grid-cols-2">
          <MonthlyBars stats={stats} />
          <WinsLossesDonut stats={stats} />
        </div>
        <WeeklyBars stats={stats} />
        <HighlightStats stats={stats} />
        <SportAnalysis stats={stats} />
        <WeeklyRecord stats={stats} picks={picks} />
        <footer className="page-footer">
          <span>Spider Sense Picks</span>
          <span>Internal performance report</span>
        </footer>
      </div>
    </main>
  );
}
