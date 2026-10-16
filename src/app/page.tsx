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
import { computeStats, formatMoney, formatSigned } from "@/lib/stats";
import type { SeasonStats } from "@/lib/types";

function SiteHeader({ stats }: { stats: SeasonStats }) {
  const since = stats.seasonStart
    ? format(parseISO(stats.seasonStart), "MMM d, yyyy")
    : null;
  const sinceShort = stats.seasonStart
    ? format(parseISO(stats.seasonStart), "MMM d")
    : null;

  return (
    <header className="pb-2 pt-4 sm:pb-4 sm:pt-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-win sm:text-xs sm:tracking-[0.22em]">
        Spider Sense Picks · Results Tracker
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div>
          <h1 className="max-w-xl text-[1.55rem] font-extrabold leading-[1.15] tracking-tight text-white sm:max-w-2xl sm:text-[2.35rem]">
            Before you <span className="text-win">tail</span> our picks,{" "}
            <span className="text-win">check</span> our record.
          </h1>
        </div>
        {since ? (
          <p className="hidden shrink-0 text-[13px] font-semibold tabular-nums text-muted sm:block">
            Since {since} ·{" "}
            <span className="font-bold text-win">{stats.settledPicks}</span>{" "}
            picks
          </p>
        ) : null}
      </div>
      {sinceShort ? (
        <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[12px] font-semibold tabular-nums text-muted sm:hidden">
          <span>Since {sinceShort}</span>
          <span className="text-white/25">·</span>
          <span
            className={
              stats.netUnits >= 0 ? "text-win" : "text-[var(--red-soft)]"
            }
          >
            {formatSigned(stats.netUnits)}u
          </span>
          <span className="text-white/25">·</span>
          <span
            className={
              stats.profitAt100 >= 0 ? "text-win" : "text-[var(--red-soft)]"
            }
          >
            {stats.profitAt100 > 0 ? "+" : ""}
            {formatMoney(stats.profitAt100)}
          </span>
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
      <div className="px-4 pb-14 pt-5 sm:hidden">
        <SiteHeader stats={stats} />

        <section className="mobile-section">
          <CumulativeChart stats={stats} picks={picks} />
        </section>

        <section className="mobile-section">
          <PerformanceCalendar picks={picks} variant="mobile" />
        </section>

        <section className="mobile-section">
          <SportAnalysis stats={stats} variant="mobile" />
        </section>

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
        <SportAnalysis stats={stats} variant="desktop" />
        <WeeklyRecord stats={stats} picks={picks} />
        <footer className="page-footer">
          <span>Spider Sense Picks</span>
          <span>Internal performance report</span>
        </footer>
      </div>
    </main>
  );
}
