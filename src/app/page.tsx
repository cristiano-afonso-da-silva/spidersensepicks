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
import { readPicks } from "@/lib/picks-store";
import { computeStats } from "@/lib/stats";

export default async function HomePage() {
  const picks = await readPicks();
  const stats = computeStats(picks);

  return (
    <main className="sm:py-12">
      {/* Mobile */}
      <div className="space-y-8 px-4 pb-12 pt-6 sm:hidden">
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
        <HeroStats stats={stats} />
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
