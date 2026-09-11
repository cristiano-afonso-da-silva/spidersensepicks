import {
  addDays,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import type {
  DayBucket,
  MonthBucket,
  Pick,
  PickResult,
  SeasonStats,
  SportBucket,
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

  // --- Daily buckets (drives charts + cumulative curve) ---
  const dayMap = new Map<string, number>();
  const dayPickCount = new Map<string, number>();
  for (const p of settled) {
    dayMap.set(
      p.date,
      round2((dayMap.get(p.date) ?? 0) + unitsFromPick(p.odds, p.units, p.result)),
    );
    dayPickCount.set(p.date, (dayPickCount.get(p.date) ?? 0) + 1);
  }

  let dayRunning = 0;
  const daily: DayBucket[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, units]) => {
      dayRunning = round2(dayRunning + units);
      return {
        date,
        label: format(parseISO(date), "M/d"),
        units,
        cumulative: dayRunning,
        result: units > 0 ? "WIN" : units < 0 ? "LOSS" : "PUSH",
        pickCount: dayPickCount.get(date) ?? 0,
      };
    });

  const cumulativeSeries =
    daily.length === 0
      ? []
      : [
          {
            date: daily[0].date,
            label: "Open",
            cumulative: 0,
          },
          ...daily.map((d) => ({
            date: d.date,
            label: d.label,
            cumulative: d.cumulative,
          })),
        ];

  // --- Weekly buckets ---
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

  let weekRunning = 0;
  const weekly: WeekBucket[] = weeklyRaw.map((w) => {
    weekRunning = round2(weekRunning + w.units);
    return {
      ...w,
      cumulative: weekRunning,
      result: w.units > 0 ? "WIN" : w.units < 0 ? "LOSS" : "PUSH",
    };
  });

  // --- Monthly ---
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

  // --- By sport ---
  type SportAgg = {
    sport: string;
    picks: number;
    wins: number;
    losses: number;
    pushes: number;
    units: number;
    stake: number;
  };
  const sportMap = new Map<string, SportAgg>();
  let totalStake = 0;
  for (const p of settled) {
    const sport = p.sport?.trim() || "Other";
    const prev = sportMap.get(sport) ?? {
      sport,
      picks: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      units: 0,
      stake: 0,
    };
    prev.picks += 1;
    if (p.result === "win") prev.wins += 1;
    else if (p.result === "loss") prev.losses += 1;
    else if (p.result === "push") prev.pushes += 1;
    prev.units = round2(prev.units + unitsFromPick(p.odds, p.units, p.result));
    prev.stake = round2(prev.stake + p.units);
    totalStake = round2(totalStake + p.units);
    sportMap.set(sport, prev);
  }

  const bySport: SportBucket[] = Array.from(sportMap.values())
    .map((s) => {
      const decided = s.wins + s.losses;
      return {
        sport: s.sport,
        picks: s.picks,
        wins: s.wins,
        losses: s.losses,
        pushes: s.pushes,
        winRate: decided === 0 ? 0 : round2((s.wins / decided) * 100),
        units: s.units,
        profitAt100: round2(s.units * 100),
        stakeShare: totalStake === 0 ? 0 : round2((s.stake / totalStake) * 100),
      };
    })
    .sort((a, b) => b.units - a.units || b.winRate - a.winRate);

  let bestSport: SeasonStats["bestSport"] = null;
  let worstSport: SeasonStats["worstSport"] = null;
  for (const s of bySport) {
    if (s.picks < 1) continue;
    if (!bestSport || s.units > bestSport.units) {
      bestSport = { sport: s.sport, units: s.units, winRate: s.winRate };
    }
    if (!worstSport || s.units < worstSport.units) {
      worstSport = { sport: s.sport, units: s.units, winRate: s.winRate };
    }
  }

  const netUnits = daily.length ? daily[daily.length - 1].cumulative : 0;
  const winningDays = daily.filter((d) => d.result === "WIN").length;
  const losingDays = daily.filter((d) => d.result === "LOSS").length;
  const closedDays = winningDays + losingDays;
  const dayWinRate =
    closedDays === 0 ? 0 : round2((winningDays / closedDays) * 100);

  const winningWeeks = weekly.filter((w) => w.result === "WIN").length;
  const losingWeeks = weekly.filter((w) => w.result === "LOSS").length;
  const pushWeeks = weekly.filter((w) => w.result === "PUSH").length;
  const closedWeeks = winningWeeks + losingWeeks;
  const weekWinRate =
    closedWeeks === 0 ? 0 : round2((winningWeeks / closedWeeks) * 100);

  let peak: SeasonStats["peak"] = null;
  for (const d of daily) {
    if (!peak || d.cumulative > peak.units) {
      peak = { units: d.cumulative, weekLabel: d.label };
    }
  }

  let largestDrawdown: SeasonStats["largestDrawdown"] = null;
  let peakSoFar = 0;
  let drawdownStartLabel = daily[0]?.label ?? "";
  let maxDd = 0;
  let maxDdFrom = "";
  let maxDdTo = "";
  for (const d of daily) {
    if (d.cumulative >= peakSoFar) {
      peakSoFar = d.cumulative;
      drawdownStartLabel = d.label;
    } else {
      const dd = round2(peakSoFar - d.cumulative);
      if (dd > maxDd) {
        maxDd = dd;
        maxDdFrom = drawdownStartLabel;
        maxDdTo = d.label;
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
  for (const d of daily) {
    if (d.units > 0 && (!largestWinningWeek || d.units > largestWinningWeek.units)) {
      largestWinningWeek = { units: d.units, label: `day of ${d.label}` };
    }
    if (d.units < 0 && (!largestLosingWeek || d.units < largestLosingWeek.units)) {
      largestLosingWeek = { units: d.units, label: `day of ${d.label}` };
    }
  }

  let longestWinStreak: SeasonStats["longestWinStreak"] = null;
  let streak = 0;
  let streakStart = "";
  for (const d of daily) {
    if (d.result === "WIN") {
      if (streak === 0) streakStart = d.label;
      streak += 1;
      if (!longestWinStreak || streak > longestWinStreak.weeks) {
        longestWinStreak = {
          weeks: streak,
          fromLabel: streakStart,
          toLabel: d.label,
        };
      }
    } else {
      streak = 0;
    }
  }

  const annotations: SeasonStats["annotations"] = [];
  if (peak && daily.length >= 1) {
    const peakDay = [...daily].reverse().find((d) => d.cumulative === peak.units);
    if (peakDay) {
      annotations.push({
        date: peakDay.date,
        label: `Peak · ${formatSigned(peak.units)}u`,
        cumulative: peak.units,
        kind: "peak",
      });
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
    daysTracked: daily.length,
    weeksTracked: weekly.length,
    winningDays,
    losingDays,
    winningWeeks,
    losingWeeks,
    pushWeeks,
    dayWinRate,
    weekWinRate,
    seasonStart: daily[0]?.date ?? null,
    seasonEnd: daily[daily.length - 1]?.date ?? null,
    peak,
    largestDrawdown,
    bestMonth,
    largestWinningWeek,
    largestLosingWeek,
    longestWinStreak,
    bestSport,
    worstSport,
    cumulativeSeries,
    daily,
    weekly,
    monthly,
    bySport,
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
  if (!start) return "No settled days yet";
  const s = format(parseISO(start), "MMM d");
  if (!end) return s;
  return `${s} – ${format(parseISO(end), "MMM d, yyyy")}`;
}

export function nextWeekHint(from = new Date()): string {
  return format(addDays(from, 0), "yyyy-MM-dd");
}
