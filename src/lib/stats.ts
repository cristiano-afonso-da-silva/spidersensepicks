import type { PickResult } from "./types";

/** Profit in units for a settled pick using American odds, rounded to cents. */
export function unitsFromPick(
  odds: number,
  units: number,
  result: PickResult,
): number {
  if (result === "pending" || result === "push" || result === "void") return 0;
  if (result === "loss") return -units;
  if (odds === 0) return 0;
  if (odds > 0) return round2(units * (odds / 100));
  return round2(units * (100 / Math.abs(odds)));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
