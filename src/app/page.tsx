import { format, parseISO } from "date-fns";
import Image from "next/image";
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
    <main className="shell py-10 sm:py-14">
      <section className="animate-rise relative mb-12 overflow-hidden rounded-[1.25rem] border border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,24,40,0.18),transparent_62%)]" />
        <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
          <div>
            <p className="section-label">Private performance report</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.95] tracking-tight text-foreground">
              Spider Sense
              <span className="block text-brand-red">Picks</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted">
              Season-to-date results · Week ending {ending}
              {stats.weeksTracked
                ? ` · ${stats.weeksTracked} weeks since ${since}`
                : ""}
            </p>
            <p className="mt-6 font-[family-name:var(--font-mono)] text-sm text-muted">
              {stats.settledPicks} settled
              {stats.pendingPicks > 0 ? ` · ${stats.pendingPicks} pending` : ""}
              {" · "}
              <span className="text-gold-bright">
                {formatSigned(stats.netUnits)}u
              </span>
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Image
              src="/logo.jpg"
              alt="Spider Sense Picks logo"
              width={420}
              height={420}
              className="h-auto w-full max-w-[280px] object-contain sm:max-w-[340px]"
              priority
            />
          </div>
        </div>
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
