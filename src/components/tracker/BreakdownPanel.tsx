import {
  formatPct,
  formatUnits,
  longDate,
  type GroupStat,
  type TrackerMetrics,
} from "@/lib/tracker-metrics";

function GroupTable({ title, rows }: { title: string; rows: GroupStat[] }) {
  return (
    <div
      className="overflow-x-auto rounded-control border border-line"
      role="region"
      aria-label={title}
      tabIndex={0}
    >
      <table className="w-full border-collapse whitespace-nowrap text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
            <th className="px-3 py-2.5 font-medium">{title}</th>
            <th className="px-3 py-2.5 text-right font-medium">Graded</th>
            <th className="px-3 py-2.5 font-medium">W–L–P–V</th>
            <th className="px-3 py-2.5 text-right font-medium">Win rate</th>
            <th className="px-3 py-2.5 text-right font-medium">Net</th>
            <th className="px-3 py-2.5 text-right font-medium">ROI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-line">
              <td className="px-3 py-2.5">{r.label}</td>
              <td className="px-3 py-2.5 text-right">
                {r.graded}
                {r.pending ? <span className="text-muted"> +{r.pending} pending</span> : null}
              </td>
              <td className="px-3 py-2.5">
                {r.wins}–{r.losses}–{r.pushes}–{r.voids}
              </td>
              <td className="px-3 py-2.5 text-right">{formatPct(r.winRate)}</td>
              <td className="px-3 py-2.5 text-right font-semibold">{formatUnits(r.netUnits)}</td>
              <td className="px-3 py-2.5 text-right">{formatPct(r.roi)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="card">
      <summary className="flex items-center gap-2 font-semibold">
        <span className="chevron text-muted" aria-hidden>
          ›
        </span>
        {title}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function BreakdownPanel({ metrics }: { metrics: TrackerMetrics }) {
  const extremes = [
    {
      label: "Best day",
      value: metrics.bestDay ? formatUnits(metrics.bestDay.netUnits) : "—",
      note: metrics.bestDay ? longDate(metrics.bestDay.date) : "No graded days",
    },
    {
      label: "Worst day",
      value: metrics.worstDay ? formatUnits(metrics.worstDay.netUnits) : "—",
      note: metrics.worstDay ? longDate(metrics.worstDay.date) : "No graded days",
    },
    {
      label: "Max drawdown",
      value: metrics.maxDrawdown ? formatUnits(-metrics.maxDrawdown.amount) : formatUnits(0),
      note: metrics.maxDrawdown
        ? `${longDate(metrics.maxDrawdown.from)} → ${longDate(metrics.maxDrawdown.to)}`
        : "No decline from a running peak",
    },
  ];

  return (
    <div className="space-y-3">
      <Panel title="Breakdown by sport">
        {metrics.bySport.length ? (
          <GroupTable title="Sport" rows={metrics.bySport} />
        ) : (
          <p className="m-0 text-muted">No picks match these filters.</p>
        )}
      </Panel>
      <Panel title="Breakdown by month">
        {metrics.byMonth.length ? (
          <GroupTable title="Month" rows={metrics.byMonth} />
        ) : (
          <p className="m-0 text-muted">No picks match these filters.</p>
        )}
      </Panel>
      <Panel title="Day range and drawdown">
        <div className="@container">
          <div className="grid gap-3 @lg:grid-cols-3">
            {extremes.map((e) => (
              <div key={e.label} className="rounded-control border border-line bg-bg p-4">
                <p className="m-0 text-xs text-muted">{e.label}</p>
                <p className="m-0 my-1 text-[20px] font-semibold">{e.value}</p>
                <p className="m-0 text-xs text-muted">{e.note}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
