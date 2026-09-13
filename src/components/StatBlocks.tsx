import type { SeasonStats } from "@/lib/types";
import { formatMoney, formatSigned } from "@/lib/stats";

export function HeroStats({ stats }: { stats: SeasonStats }) {
  const cards = [
    {
      label: "Final Net Units",
      shortLabel: "Net Units",
      value: formatSigned(stats.netUnits),
      icon: "units" as const,
      iconTone: "muted" as const,
      tone: stats.netUnits >= 0 ? ("win" as const) : ("red" as const),
    },
    {
      label: "Winning Days",
      shortLabel: "Win Days",
      value: `${stats.winningDays} / ${stats.daysTracked}`,
      icon: "trophy" as const,
      iconTone: "win" as const,
      tone: "win" as const,
    },
    {
      label: "Win Rate",
      shortLabel: "Win Rate",
      value: `${stats.dayWinRate.toFixed(1)}%`,
      icon: "target" as const,
      iconTone: "muted" as const,
      tone: "win" as const,
    },
    {
      label: "Profit at $1,000/Unit",
      shortLabel: "Profit",
      value: formatMoney(stats.profitAt100),
      icon: "cash" as const,
      iconTone: "win" as const,
      tone: stats.profitAt100 >= 0 ? ("win" as const) : ("red" as const),
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="panel animate-rise px-1.5 py-2.5 sm:px-5 sm:py-5"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-[8px] font-medium uppercase leading-tight tracking-[0.06em] text-muted sm:text-[11px] sm:tracking-[0.18em]">
              <span className="sm:hidden">{c.shortLabel}</span>
              <span className="hidden sm:inline">{c.label}</span>
            </p>
            <span className="hidden sm:inline">
              <StatIcon kind={c.icon} tone={c.iconTone} />
            </span>
          </div>
          <p
            className={`mt-2 font-[family-name:var(--font-display)] text-[clamp(0.85rem,3.6vw,1.2rem)] leading-none tracking-tight sm:mt-4 sm:text-[2.35rem] ${
              c.tone === "win"
                ? "text-win-bright"
                : c.tone === "red"
                  ? "text-red-bright"
                  : "text-foreground"
            }`}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatIcon({
  kind,
  tone = "muted",
}: {
  kind: "units" | "trophy" | "target" | "cash";
  tone?: "muted" | "win";
}) {
  const common = `h-5 w-5 ${tone === "win" ? "text-win" : "text-muted"}`;
  if (kind === "units") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19V5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 15l3.5-4 3 2.5L18 7"
          stroke="var(--win)"
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
      tone: "win" as const,
    },
    {
      label: "Best Day",
      value: stats.largestWinningWeek
        ? `${formatSigned(stats.largestWinningWeek.units)}u`
        : "—",
      sub: stats.largestWinningWeek?.label ?? "",
      tone: "win" as const,
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
      tone: "win" as const,
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
              item.tone === "red" ? "text-red-bright" : "text-win-bright"
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
