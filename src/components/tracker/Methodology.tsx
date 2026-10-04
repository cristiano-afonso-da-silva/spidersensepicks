export function Methodology() {
  return (
    <details className="card">
      <summary className="flex items-center gap-2 font-semibold">
        <span className="chevron text-muted" aria-hidden>
          ›
        </span>
        How results are calculated
      </summary>
      <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted">
        <p className="m-0">
          <span className="text-ink">Scope.</span> Every posted pick is
          included, wins and losses alike. Each pick is reported on its game
          date (reporting timezone: Toronto). Parlays count as one pick.
        </p>
        <p className="m-0">
          <span className="text-ink">Settlement.</span> Net units use the
          posted American odds and stake: a win at positive odds pays stake ×
          odds ÷ 100, a win at negative odds pays stake × 100 ÷ |odds|, a loss
          costs the stake, and pushes and voids return the stake (0.00u). A bet
          cashed out for its stake is recorded as a push.
        </p>
        <p className="m-0">
          <span className="text-ink">Net units</span> is the sum of settled
          results. Pending picks add neither profit nor loss.
        </p>
        <p className="m-0">
          <span className="text-ink">ROI</span> is net units ÷ settled risk ×
          100. Settled risk is the total stake on wins, losses and pushes;
          voids and pending picks are excluded.
        </p>
        <p className="m-0">
          <span className="text-ink">Pick win rate</span> is wins ÷ (wins +
          losses). Pushes and voids are excluded. It is not the share of
          profitable days.
        </p>
        <p className="m-0">
          <span className="text-ink">Graded picks</span> counts wins, losses,
          pushes and voids, shown as W–L–P–V so the denominator is visible.
        </p>
        <p className="m-0">
          <span className="text-ink">Filters.</span> Period and sport filters
          update every summary, chart, calendar, breakdown and export. History
          search, outcome and date selection narrow the pick history only.
          Values are calculated at full precision and displayed to two decimals.
        </p>
        <p className="m-0">
          <span className="text-ink">Updates.</span> Results are added after
          each day&apos;s card settles; the header shows when the tracker was
          last rebuilt. Past results are a record, not a promise of future
          performance.
        </p>
      </div>
    </details>
  );
}
