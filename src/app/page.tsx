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
    <header className="flex flex-col items-center gap-1.5 border-b border-border pb-4 text-center sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-5 sm:text-left">
      <div>
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold uppercase tracking-[0.14em] text-white sm:text-2xl">
          Spider <span className="text-win">Sense</span> Picks
        </p>
        <p className="mt-1 text-xs leading-snug text-muted sm:text-sm">
          Every pick logged and settled — wins, losses and pushes. Updated
          daily.
        </p>
      </div>
      {through ? (
        <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px]">
          Through {through} · {stats.settledPicks} picks
        </p>
      ) : null}
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
