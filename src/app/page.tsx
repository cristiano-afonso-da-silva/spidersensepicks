import { format, parseISO } from "date-fns";
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
import { computeStats, formatSigned } from "@/lib/stats";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default async function HomePage() {
  const picks = await readPicks();
  const stats = computeStats(picks);

  const ending = stats.seasonEnd
    ? format(parseISO(stats.seasonEnd), "MMM d, yyyy")
    : "—";
  const since = stats.seasonStart
    ? format(parseISO(stats.seasonStart), "MMM d")
    : "—";

  return (
    <main className="bg-black sm:py-16">
      {/* Mobile */}
      <div className="space-y-8 px-4 pb-12 pt-8 sm:hidden">
        <section className="animate-rise text-center">
          <img
            src={`${basePath}/logo.jpg`}
            alt="Spider Sense Picks logo"
            width={140}
            height={140}
            className="hero-logo mx-auto mb-5 h-[7rem] w-[7rem]"
          />
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted">
            Private Performance Report
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2.2rem,10vw,3rem)] leading-[0.95] tracking-tight text-white">
            Spider Sense Picks
          </h1>
          <div className="divider" />
          <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted">
            Season-to-date results · Through {ending}
            {stats.daysTracked
              ? ` · ${stats.daysTracked} days tracked since ${since}`
              : ""}
          </p>
          <p className="mt-3 font-[family-name:var(--font-mono)] text-sm tracking-wide text-muted">
            <span className="text-white">{stats.settledPicks}</span> settled
            {stats.pendingPicks > 0 ? (
              <>
                {" "}
                · <span className="text-white">{stats.pendingPicks}</span>{" "}
                pending
              </>
            ) : null}{" "}
            · Net{" "}
            <span
              className={
                stats.netUnits >= 0 ? "text-win-bright" : "text-red-bright"
              }
            >
              {formatSigned(stats.netUnits)}u
            </span>
          </p>
        </section>

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
        <section className="animate-rise mb-12 text-center">
          <img
            src={`${basePath}/logo.jpg`}
            alt="Spider Sense Picks logo"
            width={168}
            height={168}
            className="hero-logo mx-auto mb-6 h-40 w-40"
          />
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-muted">
            Private Performance Report
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.6rem,7vw,4.25rem)] leading-[0.95] tracking-tight text-white">
            Spider Sense Picks
          </h1>
          <div className="divider" />
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
            Season-to-date results · Through {ending}
            {stats.daysTracked
              ? ` · ${stats.daysTracked} days tracked since ${since}`
              : ""}
          </p>
          <p className="mt-4 font-[family-name:var(--font-mono)] text-sm tracking-wide text-muted">
            <span className="text-white">{stats.settledPicks}</span> settled
            {stats.pendingPicks > 0 ? (
              <>
                {" "}
                · <span className="text-white">{stats.pendingPicks}</span>{" "}
                pending
              </>
            ) : null}{" "}
            · Net{" "}
            <span
              className={
                stats.netUnits >= 0 ? "text-win-bright" : "text-red-bright"
              }
            >
              {formatSigned(stats.netUnits)}u
            </span>
          </p>
        </section>

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
