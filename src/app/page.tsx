import { format, parseISO } from "date-fns";
import {
  CumulativeChart,
  MonthlyBars,
  WeeklyBars,
  WinsLossesDonut,
} from "@/components/Charts";
import { HeroStats, HighlightStats } from "@/components/StatBlocks";
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
    <main className="shell py-12 sm:py-16">
      <section className="animate-rise mb-12 text-center">
        <img
          src={`${basePath}/logo.jpg`}
          alt="Spider Sense Picks logo"
          width={168}
          height={168}
          className="hero-logo mx-auto mb-6 h-[7.25rem] w-[7.25rem] sm:h-40 sm:w-40"
        />
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-brand-red">
          Private Performance Report
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.6rem,7vw,4.25rem)] leading-[0.95] tracking-tight text-gold-bright">
          Spider Sense Picks
        </h1>
        <div className="divider" />
        <p className="mx-auto mt-5 max-w-xl text-[0.98rem] leading-relaxed text-muted sm:text-base">
          Season-to-date results · Week ending {ending}
          {stats.weeksTracked
            ? ` · ${stats.weeksTracked} weeks tracked since ${since}`
            : ""}
        </p>
        <p className="mt-4 font-[family-name:var(--font-mono)] text-sm tracking-wide text-muted">
          <span className="text-gold-bright">{stats.settledPicks}</span> settled
          {stats.pendingPicks > 0 ? (
            <>
              {" "}
              · <span className="text-gold-bright">{stats.pendingPicks}</span>{" "}
              pending
            </>
          ) : null}{" "}
          · Net{" "}
          <span className="text-gold-bright">
            {formatSigned(stats.netUnits)}u
          </span>
        </p>
      </section>

      <section className="mb-10">
        <HeroStats stats={stats} />
      </section>

      <section className="mb-10">
        <CumulativeChart stats={stats} />
      </section>

      <section className="mb-10 grid gap-5 lg:grid-cols-2">
        <MonthlyBars stats={stats} />
        <WinsLossesDonut stats={stats} />
      </section>

      <section className="mb-10">
        <WeeklyBars stats={stats} />
      </section>

      <section className="mb-10">
        <HighlightStats stats={stats} />
      </section>

      <section>
        <WeeklyRecord stats={stats} picks={picks} />
      </section>

      <footer className="page-footer">
        <span>Spider Sense Picks</span>
        <span>Internal performance report</span>
      </footer>
    </main>
  );
}
