import type { Pick, PickResult } from "./types";

export type TrackerStatus = PickResult;

export interface TrackerPick {
  id: string;
  /** Reporting day, YYYY-MM-DD */
  date: string;
  sport: string;
  selection: string;
  americanOdds: number;
  stakeUnits: number;
  status: TrackerStatus;
  /** Settled net in units at full precision; null while pending. */
  netUnits: number | null;
  notes?: string;
}

export interface TrackerFilter {
  /** Inclusive YYYY-MM-DD, or null for open-ended */
  from: string | null;
  to: string | null;
  /** Sport name, or null for all sports */
  sport: string | null;
}

export interface OutcomeCounts {
  total: number;
  graded: number;
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
  pending: number;
}

export interface GroupStat extends OutcomeCounts {
  key: string;
  label: string;
  netUnits: number;
  riskUnits: number;
  roi: number | null;
  winRate: number | null;
}

export interface DayStat extends OutcomeCounts {
  date: string;
  netUnits: number;
}

export interface SeriesPoint {
  date: string | null;
  label: string;
  cumulative: number;
  dayNet: number;
}

export interface TrackerMetrics extends OutcomeCounts {
  netUnits: number;
  riskUnits: number;
  roi: number | null;
  winRate: number | null;
  firstDate: string | null;
  lastDate: string | null;
  days: DayStat[];
  series: SeriesPoint[];
  bySport: GroupStat[];
  byMonth: GroupStat[];
  bestDay: { date: string; netUnits: number } | null;
  worstDay: { date: string; netUnits: number } | null;
  maxDrawdown: { amount: number; from: string; to: string } | null;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Plain American-odds settlement. Push and void return the stake (0 net). */
export function settleUnits(
  americanOdds: number,
  stakeUnits: number,
  status: TrackerStatus,
): number | null {
  if (status === "pending") return null;
  if (status === "push" || status === "void") return 0;
  if (status === "loss") return -stakeUnits;
  if (!americanOdds) return 0;
  return americanOdds > 0
    ? (stakeUnits * americanOdds) / 100
    : (stakeUnits * 100) / Math.abs(americanOdds);
}

export function normalizePick(p: Pick): TrackerPick {
  return {
    id: p.id,
    date: p.date,
    sport: p.sport?.trim() || "Other",
    selection: p.pick,
    americanOdds: p.odds,
    stakeUnits: p.units,
    status: p.result,
    netUnits: settleUnits(p.odds, p.units, p.result),
    notes: p.notes,
  };
}

export function filterPicks(
  picks: TrackerPick[],
  filter: TrackerFilter,
): TrackerPick[] {
  return picks.filter(
    (p) =>
      (!filter.from || p.date >= filter.from) &&
      (!filter.to || p.date <= filter.to) &&
      (!filter.sport || p.sport === filter.sport),
  );
}

export function countOutcomes(picks: TrackerPick[]): OutcomeCounts {
  const c: OutcomeCounts = {
    total: picks.length,
    graded: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    voids: 0,
    pending: 0,
  };
  for (const p of picks) {
    if (p.status === "pending") c.pending += 1;
    else {
      c.graded += 1;
      if (p.status === "win") c.wins += 1;
      else if (p.status === "loss") c.losses += 1;
      else if (p.status === "push") c.pushes += 1;
      else if (p.status === "void") c.voids += 1;
    }
  }
  return c;
}

function sumNet(picks: TrackerPick[]): number {
  let net = 0;
  for (const p of picks) if (p.netUnits !== null) net += p.netUnits;
  return net;
}

/** Risk = stakes on wins, losses and pushes. Voids and pending excluded. */
function sumRisk(picks: TrackerPick[]): number {
  let risk = 0;
  for (const p of picks) {
    if (p.status === "win" || p.status === "loss" || p.status === "push") {
      risk += p.stakeUnits;
    }
  }
  return risk;
}

function rates(c: OutcomeCounts, net: number, risk: number) {
  return {
    roi: risk > 0 ? (net / risk) * 100 : null,
    winRate: c.wins + c.losses > 0 ? (c.wins / (c.wins + c.losses)) * 100 : null,
  };
}

function groupBy(
  picks: TrackerPick[],
  keyOf: (p: TrackerPick) => string,
  labelOf: (key: string) => string,
): GroupStat[] {
  const map = new Map<string, TrackerPick[]>();
  for (const p of picks) {
    const key = keyOf(p);
    const list = map.get(key);
    if (list) list.push(p);
    else map.set(key, [p]);
  }
  return Array.from(map.entries()).map(([key, list]) => {
    const c = countOutcomes(list);
    const netUnits = sumNet(list);
    const riskUnits = sumRisk(list);
    return { key, label: labelOf(key), ...c, netUnits, riskUnits, ...rates(c, netUnits, riskUnits) };
  });
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function shortDate(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}`;
}

export function longDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
}

export function calculateTrackerMetrics(
  picks: TrackerPick[],
  rangeStart: string | null = null,
): TrackerMetrics {
  const counts = countOutcomes(picks);
  const netUnits = sumNet(picks);
  const riskUnits = sumRisk(picks);

  const dayMap = new Map<string, TrackerPick[]>();
  for (const p of picks) {
    const list = dayMap.get(p.date);
    if (list) list.push(p);
    else dayMap.set(p.date, [p]);
  }
  const days: DayStat[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({ date, ...countOutcomes(list), netUnits: sumNet(list) }));

  const startDate = rangeStart ?? days[0]?.date ?? null;
  const series: SeriesPoint[] = [];
  let running = 0;
  let peak = 0;
  let peakDate = startDate ?? "";
  let maxDrawdown: TrackerMetrics["maxDrawdown"] = null;
  let bestDay: TrackerMetrics["bestDay"] = null;
  let worstDay: TrackerMetrics["worstDay"] = null;

  const gradedDays = days.filter((d) => d.graded > 0);
  if (gradedDays.length > 0) {
    series.push({ date: startDate, label: "Start", cumulative: 0, dayNet: 0 });
  }
  for (const d of gradedDays) {
    running += d.netUnits;
    series.push({ date: d.date, label: shortDate(d.date), cumulative: running, dayNet: d.netUnits });
    if (running > peak) {
      peak = running;
      peakDate = d.date;
    } else if (peak - running > (maxDrawdown?.amount ?? 0)) {
      maxDrawdown = { amount: peak - running, from: peakDate, to: d.date };
    }
    if (!bestDay || d.netUnits > bestDay.netUnits) bestDay = { date: d.date, netUnits: d.netUnits };
    if (!worstDay || d.netUnits < worstDay.netUnits) worstDay = { date: d.date, netUnits: d.netUnits };
  }

  const bySport = groupBy(picks, (p) => p.sport, (k) => k).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const byMonth = groupBy(picks, (p) => p.date.slice(0, 7), monthLabel).sort((a, b) =>
    a.key.localeCompare(b.key),
  );

  return {
    ...counts,
    netUnits,
    riskUnits,
    ...rates(counts, netUnits, riskUnits),
    firstDate: days[0]?.date ?? null,
    lastDate: days[days.length - 1]?.date ?? null,
    days,
    series,
    bySport,
    byMonth,
    bestDay,
    worstDay,
    maxDrawdown,
  };
}

const MINUS = "\u2212";

/** Signed units at 2 decimals, e.g. +1.25u, −0.50u, 0.00u. */
export function formatUnits(n: number, suffix = "u"): string {
  if (Math.abs(n) < 0.005) return `0.00${suffix}`;
  return `${n > 0 ? "+" : MINUS}${Math.abs(n).toFixed(2)}${suffix}`;
}

export function formatStake(n: number): string {
  return `${n.toFixed(2)}u`;
}

export function formatPct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const v = Math.abs(n) < 0.05 ? 0 : n;
  return `${v < 0 ? MINUS : ""}${Math.abs(v).toFixed(1)}%`;
}

export function formatOdds(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `${MINUS}${Math.abs(n)}` : "—";
}

export function statusLabel(s: TrackerStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function recordLine(c: OutcomeCounts): string {
  return `${c.wins}W · ${c.losses}L · ${c.pushes}P · ${c.voids}V`;
}
