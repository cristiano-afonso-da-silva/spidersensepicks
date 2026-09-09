import type { SeasonStats } from "@/lib/types";
import { formatMoney, formatSigned } from "@/lib/stats";

export function HeroStats({ stats }: { stats: SeasonStats }) {
  const cards = [
    {
      label: "Final Net Units",
      value: formatSigned(stats.netUnits),
      foot: stats.daysTracked
        ? `Cumulative, day ${stats.daysTracked}.`
        : "No settled days yet.",
      icon: "units" as const,
    },
    {
      label: "Winning Days",
      value: `${stats.winningDays} / ${stats.daysTracked}`,
      foot: `${stats.losingDays} losing day${stats.losingDays === 1 ? "" : "s"}.`,
      icon: "trophy" as const,
    },
    {
      label: "Win Rate",
      value: `${stats.dayWinRate.toFixed(1)}%`,
      foot: "Days closed positive.",
      icon: "target" as const,
    },
    {
      label: "Profit at $100/Unit",
      value: formatMoney(stats.profitAt100),
      foot: "Scales linearly by stake.",
      icon: "cash" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="panel animate-rise px-5 py-5"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {c.label}
            </p>
            <StatIcon kind={c.icon} />
          </div>
          <p className="mt-4 font-[family-name:var(--font-display)] text-[2.35rem] leading-none tracking-tight text-gold-bright">
            {c.value}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted">{c.foot}</p>
        </div>
      ))}
    </div>
  );
}

function StatIcon({
  kind,
}: {
  kind: "units" | "trophy" | "target" | "cash";
}) {
  const common = "h-5 w-5 text-gold";
  if (kind === "units") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19V5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 15l3.5-4 3 2.5L18 7"
          stroke="var(--red)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "trophy") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 4h8v3a4 4 0 01-8 0V4z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M8 5H5a2 2 0 002 3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 5h3a2 2 0 01-2 3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 14h4v2h-4zM9 20h6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "target") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="7" stroke="var(--red)" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8c0-2 2.2-3.5 5-3.5s5 1.5 5 3.5-2.2 3.5-5 3.5S7 12 7 10v6c0 2 2.2 3.5 5 3.5s5-1.5 5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
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
      label: "Best Day",
      value: stats.largestWinningWeek
        ? `${formatSigned(stats.largestWinningWeek.units)}u`
        : "—",
      sub: stats.largestWinningWeek?.label ?? "",
      tone: "gold" as const,
    },
    {
      label: "Worst Day",
      value: stats.largestLosingWeek
        ? `${formatSigned(stats.largestLosingWeek.units)}u`
        : "—",
      sub: stats.largestLosingWeek?.label ?? "",
      tone: "red" as const,
    },
    {
      label: "Win Streak",
      value: stats.longestWinStreak
        ? `${stats.longestWinStreak.weeks} day${stats.longestWinStreak.weeks === 1 ? "" : "s"}`
        : "—",
      sub: stats.longestWinStreak
        ? `${stats.longestWinStreak.fromLabel} – ${stats.longestWinStreak.toLabel}`
        : "",
      tone: "gold" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="panel animate-rise px-5 py-5"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            {item.label}
          </p>
          <p
            className={`mt-3 font-[family-name:var(--font-display)] text-[1.95rem] leading-none ${
              item.tone === "red" ? "text-red-bright" : "text-gold-bright"
            }`}
          >
            {item.value}
          </p>
          {item.sub ? (
            <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-muted">
              {item.sub}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
