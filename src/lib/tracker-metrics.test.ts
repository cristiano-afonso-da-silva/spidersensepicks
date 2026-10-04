import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTrackerMetrics,
  filterPicks,
  formatPct,
  formatUnits,
  type TrackerPick,
  type TrackerStatus,
  settleUnits,
} from "./tracker-metrics.ts";

function pick(
  id: string,
  date: string,
  odds: number,
  stake: number,
  status: TrackerStatus,
  sport = "NFL",
): TrackerPick {
  return {
    id,
    date,
    sport,
    selection: id,
    americanOdds: odds,
    stakeUnits: stake,
    status,
    netUnits: settleUnits(odds, stake, status),
  };
}

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test("handoff fixture reconciles", () => {
  const m = calculateTrackerMetrics([
    pick("w", "2026-10-01", -110, 1, "win"),
    pick("l", "2026-10-01", -110, 0.5, "loss"),
    pick("p", "2026-10-02", -110, 1, "push"),
    pick("v", "2026-10-02", -110, 0.5, "void"),
    pick("x", "2026-10-03", -110, 1, "pending"),
  ]);
  close(m.netUnits, 0.4090909);
  close(m.riskUnits, 2.5);
  close(m.roi ?? NaN, 16.363636);
  close(m.winRate ?? NaN, 50);
  assert.equal(m.graded, 4);
  assert.equal(m.pending, 1);
  close(m.series[m.series.length - 1].cumulative, m.netUnits);
  assert.equal(m.series[0].cumulative, 0);
});

test("pending-only and void-only have no rates", () => {
  for (const status of ["pending", "void"] as const) {
    const m = calculateTrackerMetrics([pick("a", "2026-10-01", -110, 1, status)]);
    assert.equal(m.winRate, null);
    assert.equal(m.roi, null);
    assert.ok(Number.isFinite(m.netUnits));
    assert.equal(formatPct(m.roi), "—");
  }
});

test("all-loss range stays visible and negative", () => {
  const m = calculateTrackerMetrics([
    pick("a", "2026-10-01", -110, 1, "loss"),
    pick("b", "2026-10-02", 150, 0.5, "loss"),
  ]);
  close(m.netUnits, -1.5);
  assert.deepEqual(
    m.series.map((s) => s.cumulative),
    [0, -1, -1.5],
  );
  close(m.maxDrawdown?.amount ?? 0, 1.5);
  assert.equal(m.winRate, 0);
});

test("filters are inclusive and sport-aware", () => {
  const picks = [
    pick("a", "2026-09-30", -110, 1, "win", "MLB"),
    pick("b", "2026-10-01", -110, 1, "win", "NFL"),
    pick("c", "2026-10-31", -110, 1, "loss", "NFL"),
    pick("d", "2026-11-01", -110, 1, "loss", "NFL"),
  ];
  const oct = filterPicks(picks, { from: "2026-10-01", to: "2026-10-31", sport: null });
  assert.deepEqual(oct.map((p) => p.id), ["b", "c"]);
  const nfl = filterPicks(picks, { from: null, to: null, sport: "NFL" });
  assert.equal(nfl.length, 3);
});

test("formatter normalizes negative zero and signs", () => {
  assert.equal(formatUnits(-0.001), "0.00u");
  assert.equal(formatUnits(1.25), "+1.25u");
  assert.equal(formatUnits(-2.5), "\u22122.50u");
});
