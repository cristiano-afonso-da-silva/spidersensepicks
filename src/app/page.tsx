import { format, parseISO } from "date-fns";
import Image from "next/image";
import {
  CumulativeChart,
  MonthlyBars,
  WeeklyBars,
  WinsLossesDonut,
} from "@/components/Charts";
import {
  HeroStats,
  HighlightStats,
} from "@/components/StatBlocks";
import { WeeklyRecord } from "@/components/WeeklyRecord";
import { readPicks } from "@/lib/picks-store";
import { computeStats } from "@/lib/stats";

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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="animate-rise mb-10 text-center">
        <Image
          src="/logo.jpg"
          alt="Spider Sense Picks logo"
          width={160}
          height={160}
          className="mx-auto mb-5 h-28 w-28 rounded-full object-cover ring-2 ring-brand-red/50 sm:h-36 sm:w-36 animate-glow"
          priority
        />
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
          Private Performance Report
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-red-bright sm:text-6xl">
          Spider Sense Picks
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted sm:text-base">
          Season-to-date results · Week ending {ending}
          {stats.weeksTracked
            ? ` · ${stats.weeksTracked} weeks tracked since ${since}`
            : ""}
        </p>
        <p className="mt-4 text-sm text-muted">
          <span className="text-red-bright">{stats.settledPicks}</span> settled
          picks
          {stats.pendingPicks > 0
            ? ` · ${stats.pendingPicks} pending`
            : ""}{" "}
          · Net{" "}
          <span className="text-gold-bright">
            {stats.netUnits > 0 ? "+" : ""}
            {stats.netUnits.toFixed(1)}u
          </span>
        </p>
      </section>

      <section className="mb-8">
        <HeroStats stats={stats} />
      </section>

      <section className="mb-8">
        <CumulativeChart stats={stats} />
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <MonthlyBars stats={stats} />
        <WinsLossesDonut stats={stats} />
      </section>

      <section className="mb-8">
        <WeeklyBars stats={stats} />
      </section>

      <section className="mb-8">
        <HighlightStats stats={stats} />
      </section>

      <section>
        <WeeklyRecord stats={stats} picks={picks} />
      </section>
    </main>
  );
}
