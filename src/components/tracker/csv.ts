import type { TrackerMetrics, TrackerPick } from "@/lib/tracker-metrics";

/** Quote a CSV field; free text starting with = + - @ is neutralized for spreadsheets. */
function textField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function numField(n: number | null, digits = 4): string {
  if (n === null) return "";
  const v = Math.abs(n) < 0.5 * 10 ** -digits ? 0 : n;
  return v.toFixed(digits);
}

export function buildCsv({
  picks,
  metrics,
  rangeText,
  periodLabel,
  sport,
  generatedAt,
}: {
  picks: TrackerPick[];
  metrics: TrackerMetrics;
  rangeText: string;
  periodLabel: string;
  sport: string | null;
  generatedAt: string;
}): string {
  const meta: [string, string][] = [
    ["Export", "Spider Sense Picks Results Tracker"],
    ["Generated", generatedAt],
    ["Period", `${periodLabel} (${rangeText})`],
    ["Sport", sport ?? "All sports"],
    ["Scope", "All posted picks; reporting date in America/Toronto"],
    ["Win rate convention", "wins / (wins + losses); pushes and voids excluded"],
    ["ROI convention", "net units / stake on wins, losses and pushes; voids and pending excluded"],
    ["Net units", numField(metrics.netUnits)],
    ["ROI %", numField(metrics.roi, 2)],
    ["Pick win rate %", numField(metrics.winRate, 2)],
    [
      "Graded record (W-L-P-V)",
      `${metrics.wins}-${metrics.losses}-${metrics.pushes}-${metrics.voids}`,
    ],
    ["Pending", String(metrics.pending)],
  ];

  const lines = meta.map(([k, v]) => `${textField(k)},${textField(v)}`);
  lines.push("");
  lines.push(
    ["date", "sport", "selection", "american_odds", "stake_units", "result", "net_units", "notes"]
      .map(textField)
      .join(","),
  );
  const ordered = [...picks].sort((a, b) => a.date.localeCompare(b.date));
  for (const p of ordered) {
    lines.push(
      [
        textField(p.date),
        textField(p.sport),
        textField(p.selection),
        String(p.americanOdds),
        numField(p.stakeUnits, 3),
        textField(p.status),
        numField(p.netUnits, 6),
        textField(p.notes ?? ""),
      ].join(","),
    );
  }
  return `\ufeff${lines.join("\r\n")}\r\n`;
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
