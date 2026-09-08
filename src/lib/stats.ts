import {
  addDays,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import type {
  MonthBucket,
  Pick,
  PickResult,
  SeasonStats,
  WeekBucket,
} from "./types";

/** Profit in units for a settled pick using American odds. */
export function unitsFromPick(
  odds: number,
  units: number,
  result: PickResult,
): number {
  if (result === "pending" || result === "push") return 0;
  if (result === "loss") return -units;
  if (odds === 0) return 0;
  if (odds > 0) return round2(units * (odds / 100));
  return round2(units * (100 / Math.abs(odds)));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function weekBounds(dateStr: string) {
  const d = parseISO(dateStr);
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return {
    weekStart: format(start, "yyyy-MM-dd"),
    weekEnd: format(end, "yyyy-MM-dd"),
    label: format(start, "M/d"),
  };
}

export function computeStats(picks: Pick[]): SeasonStats {
  const settled = picks
    .filter((p) => p.result !== "pending")
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const pendingPicks = picks.filter((p) => p.result === "pending").length;
  const wins = settled.filter((p) => p.result === "win").length;
  const losses = settled.filter((p) => p.result === "loss").length;
  const pushes = settled.filter((p) => p.result === "push").length;
  const decided = wins + losses;
  const winRate = decided === 0 ? 0 : round2((wins / decided) * 100);

  const weekMap = new Map<
    string,
    { weekStart: string; weekEnd: string; label: string; units: number; pickCount: number }
  >();

  for (const p of settled) {
    const b = weekBounds(p.date);
    const prev = weekMap.get(b.weekStart) ?? {
      weekStart: b.weekStart,
      weekEnd: b.weekEnd,
      label: b.label,
      units: 0,
      pickCount: 0,
    };
    prev.units = round2(prev.units + unitsFromPick(p.odds, p.units, p.result));
    prev.pickCount += 1;
    weekMap.set(b.weekStart, prev);
  }

  const weeklyRaw = Array.from(weekMap.values()).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart),
  );

  let running = 0;
  const weekly: WeekBucket[] = weeklyRaw.map((w) => {
    running = round2(running + w.units);
    return {
      ...w,
      cumulative: running,
      result: w.units > 0 ? "WIN" : w.units < 0 ? "LOSS" : "PUSH",
    };
  });

  const cumulativeSeries = weekly.map((w) => ({
    date: w.weekStart,
    label: w.label,
    cumulative: w.cumulative,
  }));

  const monthMap = new Map<string, number>();
  for (const p of settled) {
    const key = format(parseISO(p.date), "yyyy-MM");
    monthMap.set(
      key,
      round2((monthMap.get(key) ?? 0) + unitsFromPick(p.odds, p.units, p.result)),
    );
  }
  const monthly: MonthBucket[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, units]) => ({
      key,
      label: format(parseISO(`${key}-01`), "MMM"),
      units,
    }));

  const netUnits = weekly.length ? weekly[weekly.length - 1].cumulative : 0;
  const winningWeeks = weekly.filter((w) => w.result === "WIN").length;
  const losingWeeks = weekly.filter((w) => w.result === "LOSS").length;
  const pushWeeks = weekly.filter((w) => w.result === "PUSH").length;
  const closedWeeks = winningWeeks + losingWeeks;
  const weekWinRate =
    closedWeeks === 0 ? 0 : round2((winningWeeks / closedWeeks) * 100);

  let peak: SeasonStats["peak"] = null;
  for (const w of weekly) {
    if (!peak || w.cumulative > peak.units) {
      peak = { units: w.cumulative, weekLabel: w.label };
    }
  }

  let largestDrawdown: SeasonStats["largestDrawdown"] = null;
  let peakSoFar = 0;
  let drawdownStartLabel = weekly[0]?.label ?? "";
  let maxDd = 0;
  let maxDdFrom = "";
  let maxDdTo = "";
  for (const w of weekly) {
    if (w.cumulative >= peakSoFar) {
      peakSoFar = w.cumulative;
      drawdownStartLabel = w.label;
    } else {
      const dd = round2(peakSoFar - w.cumulative);
      if (dd > maxDd) {
        maxDd = dd;
        maxDdFrom = drawdownStartLabel;
        maxDdTo = w.label;
      }
    }
  }
  if (maxDd > 0) {
    largestDrawdown = {
      amount: round2(-maxDd),
      fromLabel: maxDdFrom,
      toLabel: maxDdTo,
    };
  }

  let bestMonth: SeasonStats["bestMonth"] = null;
  for (const m of monthly) {
    if (!bestMonth || m.units > bestMonth.units) {
      bestMonth = {
        label: format(parseISO(`${m.key}-01`), "MMMM"),
        units: m.units,
      };
    }
  }

  let largestWinningWeek: SeasonStats["largestWinningWeek"] = null;
  let largestLosingWeek: SeasonStats["largestLosingWeek"] = null;
  for (const w of weekly) {
    if (w.units > 0 && (!largestWinningWeek || w.units > largestWinningWeek.units)) {
      largestWinningWeek = { units: w.units, label: `week of ${w.label}` };
    }
    if (w.units < 0 && (!largestLosingWeek || w.units < largestLosingWeek.units)) {
      largestLosingWeek = { units: w.units, label: `week of ${w.label}` };
    }
  }

  let longestWinStreak: SeasonStats["longestWinStreak"] = null;
  let streak = 0;
  let streakStart = "";
  for (const w of weekly) {
    if (w.result === "WIN") {
      if (streak === 0) streakStart = w.label;
      streak += 1;
      const endLabel = w.label;
      if (!longestWinStreak || streak > longestWinStreak.weeks) {
        longestWinStreak = {
          weeks: streak,
          fromLabel: streakStart,
          toLabel: endLabel,
        };
      }
    } else {
      streak = 0;
    }
  }

  const annotations: SeasonStats["annotations"] = [];
  if (weekly.length >= 2) {
    let localPeak = weekly[0].cumulative;
    let ddStart: WeekBucket | null = null;
    let ddLow: WeekBucket | null = null;
    for (let i = 1; i < weekly.length; i++) {
      const w = weekly[i];
      if (w.cumulative >= localPeak) {
        localPeak = w.cumulative;
        ddStart = null;
        ddLow = null;
      } else {
        if (!ddStart) ddStart = weekly[i - 1];
        if (!ddLow || w.cumulative < ddLow.cumulative) ddLow = w;
      }
    }
    if (ddStart && ddLow && ddStart.weekStart !== ddLow.weekStart) {
      annotations.push({
        date: ddStart.weekStart,
        label: `Drawdown begins · ${ddStart.label}`,
        cumulative: ddStart.cumulative,
      });
      annotations.push({
        date: ddLow.weekStart,
        label: `Drawdown low · ${ddLow.label}`,
        cumulative: ddLow.cumulative,
      });
    }
    if (peak) {
      const peakWeek = weekly.find((w) => w.cumulative === peak!.units);
      if (peakWeek) {
        annotations.push({
          date: peakWeek.weekStart,
          label: `Season peak · +${peak.units.toFixed(1)}u`,
          cumulative: peak.units,
        });
      }
    }
  }

  return {
    settledPicks: settled.length,
    pendingPicks,
    wins,
    losses,
    pushes,
    netUnits,
    winRate,
    profitAt100: round2(netUnits * 100),
    weeksTracked: weekly.length,
    winningWeeks,
    losingWeeks,
    pushWeeks,
    weekWinRate,
    seasonStart: weekly[0]?.weekStart ?? null,
    seasonEnd: weekly[weekly.length - 1]?.weekEnd ?? null,
    peak,
    largestDrawdown,
    bestMonth,
    largestWinningWeek,
    largestLosingWeek,
    longestWinStreak,
    cumulativeSeries,
    weekly,
    monthly,
    annotations,
  };
}

export function formatSigned(n: number, digits = 1): string {
  const abs = Math.abs(n).toFixed(digits);
  if (n > 0) return `+${abs}`;
  if (n < 0) return `-${abs}`;
  return abs;
}

export function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "No settled weeks yet";
  const s = format(parseISO(start), "MMM d");
  if (!end) return s;
  return `${s} – ${format(parseISO(end), "MMM d, yyyy")}`;
}

export function nextWeekHint(from = new Date()): string {
  return format(addDays(from, 0), "yyyy-MM-dd");
}
