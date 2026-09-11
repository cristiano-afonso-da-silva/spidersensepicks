export type PickResult = "win" | "loss" | "push" | "pending";

/** Daily pick log entry — follow this shape when adding picks. */
export interface Pick {
  /** Auto-generated UUID */
  id: string;
  /** Settled / game date as YYYY-MM-DD */
  date: string;
  /** Short description, e.g. "Lakers -4.5" or "Chiefs ML" */
  pick: string;
  /** Optional sport tag: NBA, NFL, MLB, NHL, NCAAB, etc. */
  sport?: string;
  /**
   * American odds only.
   * Examples: -110, -105, +150, +200
   */
  odds: number;
  /** Stake size in units (0.5, 1, 1.5, 2, …) */
  units: number;
  /** Outcome after the game settles */
  result: PickResult;
  /** Optional note */
  notes?: string;
}

export interface CreatePickInput {
  date: string;
  pick: string;
  sport?: string;
  odds: number;
  units: number;
  result: PickResult;
  notes?: string;
}

export interface DayBucket {
  date: string;
  label: string;
  units: number;
  cumulative: number;
  result: "WIN" | "LOSS" | "PUSH";
  pickCount: number;
}

export interface WeekBucket {
  weekStart: string;
  weekEnd: string;
  label: string;
  units: number;
  cumulative: number;
  result: "WIN" | "LOSS" | "PUSH";
  pickCount: number;
}

export interface MonthBucket {
  key: string;
  label: string;
  units: number;
}

export interface SportBucket {
  sport: string;
  picks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  units: number;
  profitAt100: number;
  /** Share of total units risked (settled stakes). */
  stakeShare: number;
}

export interface SeasonStats {
  settledPicks: number;
  pendingPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  netUnits: number;
  winRate: number;
  profitAt100: number;
  daysTracked: number;
  weeksTracked: number;
  winningDays: number;
  losingDays: number;
  winningWeeks: number;
  losingWeeks: number;
  pushWeeks: number;
  dayWinRate: number;
  weekWinRate: number;
  seasonStart: string | null;
  seasonEnd: string | null;
  peak: { units: number; weekLabel: string } | null;
  largestDrawdown: {
    amount: number;
    fromLabel: string;
    toLabel: string;
  } | null;
  bestMonth: { label: string; units: number } | null;
  largestWinningWeek: { units: number; label: string } | null;
  largestLosingWeek: { units: number; label: string } | null;
  longestWinStreak: {
    weeks: number;
    fromLabel: string;
    toLabel: string;
  } | null;
  bestSport: { sport: string; units: number; winRate: number } | null;
  worstSport: { sport: string; units: number; winRate: number } | null;
  cumulativeSeries: { date: string; label: string; cumulative: number }[];
  daily: DayBucket[];
  weekly: WeekBucket[];
  monthly: MonthBucket[];
  bySport: SportBucket[];
  annotations: { date: string; label: string; cumulative: number; kind?: "peak" | "drawdown" }[];
}
