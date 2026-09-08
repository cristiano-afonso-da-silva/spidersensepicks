import type { SeasonStats } from "@/lib/types";
import { formatMoney, formatSigned } from "@/lib/stats";

export function HeroStats({ stats }: { stats: SeasonStats }) {
  const cards = [
    {
      label: "Net Units",
      value: formatSigned(stats.netUnits),
      foot: stats.weeksTracked
        ? `Through week ${stats.weeksTracked}`
        : "No settled weeks yet",
    },
    {
      label: "Winning Weeks",
      value: `${stats.winningWeeks}/${stats.weeksTracked || 0}`,
      foot: `${stats.losingWeeks} losing`,
    },
    {
      label: "Win Rate",
      value: `${stats.weekWinRate.toFixed(1)}%`,
      foot: "Weeks closed green",
    },
    {
      label: "Profit @ $100/u",
      value: formatMoney(stats.profitAt100),
      foot: "Linear to unit size",
    },
  ];

  return (
    <div className="stat-strip animate-rise">
      {cards.map((c) => (
        <div key={c.label} className="stat-cell">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            {c.label}
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-[2rem] leading-none text-gold-bright sm:text-[2.35rem]">
            {c.value}
          </p>
          <p className="mt-2 text-xs text-muted">{c.foot}</p>
        </div>
      ))}
    </div>
  );
}

export function HighlightStats({ stats }: { stats: SeasonStats }) {
  const items = [
    {
      label: "Best Month",
      value: stats.bestMonth?.label ?? "—",
      sub: stats.bestMonth ? `${formatSigned(stats.bestMonth.units)}u` : "",
      tone: "gold" as const,
    },
    {
      label: "Best Week",
      value: stats.largestWinningWeek
        ? `${formatSigned(stats.largestWinningWeek.units)}u`
        : "—",
      sub: stats.largestWinningWeek?.label ?? "",
      tone: "gold" as const,
    },
    {
      label: "Worst Week",
      value: stats.largestLosingWeek
        ? `${formatSigned(stats.largestLosingWeek.units)}u`
        : "—",
      sub: stats.largestLosingWeek?.label ?? "",
      tone: "red" as const,
    },
    {
      label: "Win Streak",
      value: stats.longestWinStreak
        ? `${stats.longestWinStreak.weeks} wk`
        : "—",
      sub: stats.longestWinStreak
        ? `${stats.longestWinStreak.fromLabel} – ${stats.longestWinStreak.toLabel}`
        : "",
      tone: "gold" as const,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="panel px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {item.label}
          </p>
          <p
            className={`mt-2 font-[family-name:var(--font-display)] text-[1.85rem] leading-none ${
              item.tone === "red" ? "text-red-bright" : "text-gold-bright"
            }`}
          >
            {item.value}
          </p>
          {item.sub ? (
            <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-muted">
              {item.sub}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
