import {
  formatPct,
  formatUnits,
  recordLine,
  type TrackerMetrics,
} from "@/lib/tracker-metrics";

export function SummaryCards({ metrics }: { metrics: TrackerMetrics }) {
  const cards = [
    {
      label: "Net units",
      value: formatUnits(metrics.netUnits),
      note: "Selected period",
    },
    {
      label: "ROI",
      value: formatPct(metrics.roi),
      note: `Net ÷ ${metrics.riskUnits.toFixed(2)}u settled risk`,
    },
    {
      label: "Pick win rate",
      value: formatPct(metrics.winRate),
      note: "Wins ÷ (wins + losses)",
    },
    {
      label: "Graded picks",
      value: String(metrics.graded),
      note: `${recordLine(metrics)} · ${metrics.pending} pending`,
    },
  ];

  return (
    <section aria-label="Selected period metrics" className="@container">
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4" aria-live="polite">
        {cards.map((c) => (
          <div key={c.label} className="card flex flex-col">
            <p className="m-0 text-xs text-muted">{c.label}</p>
            <p className="my-1.5 text-[24px] font-semibold leading-tight tracking-[-0.03em] @2xl:text-[30px]">
              {c.value}
            </p>
            <p className="m-0 mt-auto text-xs text-muted">{c.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
