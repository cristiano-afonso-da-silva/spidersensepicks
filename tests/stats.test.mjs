import assert from "node:assert/strict";
import test from "node:test";
import { computeStats } from "../src/lib/stats.ts";

const summary = {
  date: "2026-10-30",
  units: -0.8,
  notes: "Individual picks and stakes unavailable.",
};

function pick(date, odds, units, result) {
  return { id: `${date}-${odds}`, date, pick: "Example pick", sport: "Basketball", odds, units, result };
}

test("a summary-only day contributes to every time-based total without inventing picks", () => {
  const stats = computeStats([], [summary]);
  assert.equal(stats.netUnits, -0.8);
  assert.equal(stats.daily[0].units, -0.8);
  assert.equal(stats.daily[0].summary, summary.notes);
  assert.equal(stats.daily[0].pickCount, 0);
  assert.equal(stats.weekly[0].units, -0.8);
  assert.equal(stats.weekly[0].pickCount, 0);
  assert.equal(stats.monthly[0].units, -0.8);
  assert.equal(stats.cumulativeSeries.at(-1).cumulative, -0.8);
  assert.equal(stats.profitAt100, -800);
  assert.equal(stats.settledPicks, 0);
  assert.equal(stats.wins, 0);
  assert.equal(stats.losses, 0);
  assert.equal(stats.pushes, 0);
  assert.equal(stats.pendingPicks, 0);
  assert.deepEqual(stats.bySport, []);
  assert.equal(stats.daysTracked, 1);
  assert.equal(stats.losingDays, 1);
  assert.equal(stats.losingWeeks, 1);
  assert.equal(stats.seasonStart, summary.date);
  assert.equal(stats.seasonEnd, summary.date);
});

test("mixed pick and summary days remain chronological and preserve pick records", () => {
  const picks = [
    pick("2026-10-31", -110, 1, "win"),
    pick("2026-10-29", -102, 1, "loss"),
    pick("2026-10-29", -127, 1, "loss"),
    pick("2026-10-29", 168, 1, "win"),
    pick("2026-10-31", 180, 0.5, "win"),
  ];
  const original = structuredClone(picks);
  const before = computeStats(picks);
  const stats = computeStats(picks, [summary]);
  assert.deepEqual(stats.daily.map((d) => [d.date, d.units, d.pickCount]), [
    ["2026-10-29", -0.32, 3],
    ["2026-10-30", -0.8, 0],
    ["2026-10-31", 1.81, 2],
  ]);
  assert.equal(stats.netUnits, 0.69);
  assert.equal(stats.weekly[0].units, 0.69);
  assert.equal(stats.monthly[0].units, 0.69);
  assert.equal(stats.weekly[0].pickCount, 5);
  for (const field of ["settledPicks", "wins", "losses", "pushes", "winRate", "pendingPicks", "bySport"]) {
    assert.deepEqual(stats[field], before[field]);
  }
  assert.deepEqual(picks, original);
});

test("a summary is the complete daily total and cannot double-count partial picks", () => {
  const picks = [pick(summary.date, -110, 1, "loss")];
  const stats = computeStats(picks, [summary]);
  assert.equal(stats.netUnits, -0.8);
  assert.equal(stats.weekly[0].units, -0.8);
  assert.equal(stats.monthly[0].units, -0.8);
  assert.equal(stats.settledPicks, 1);
  assert.equal(stats.losses, 1);
  assert.equal(stats.daily[0].pickCount, 1);
  assert.equal(computeStats(picks).netUnits, -1);
});

test("positive and flat summaries affect day outcomes without adding wins or pushes", () => {
  const stats = computeStats([], [
    { ...summary, date: "2026-10-31", units: 1.5 },
    { ...summary, date: "2026-11-01", units: 0 },
  ]);
  assert.equal(stats.netUnits, 1.5);
  assert.equal(stats.winningDays, 1);
  assert.equal(stats.daysTracked, 2);
  assert.equal(stats.wins, 0);
  assert.equal(stats.pushes, 0);
  assert.deepEqual(stats.monthly.map((m) => m.units), [1.5, 0]);
});
