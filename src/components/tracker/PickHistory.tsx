"use client";

import {
  formatOdds,
  formatStake,
  formatUnits,
  longDate,
  statusLabel,
  type TrackerPick,
  type TrackerStatus,
} from "@/lib/tracker-metrics";

export const PAGE_SIZE = 25;

export type OutcomeFilter = "all" | TrackerStatus;

const OUTCOMES: OutcomeFilter[] = ["all", "win", "loss", "push", "void", "pending"];

/** Notes that add information beyond the stake column. */
export function auditNote(notes?: string): string | null {
  if (!notes) return null;
  const parts = notes
    .split(" · ")
    .map((s) => s.trim())
    .filter((s) => s && !/^[\d.]+ Unit (Play|Max Play|Lotto)$/i.test(s));
  return parts.length ? parts.join(" · ") : null;
}

export function PickHistory({
  picks,
  selectedDate,
  onClearDate,
  search,
  onSearch,
  outcome,
  onOutcome,
  page,
  onPage,
}: {
  picks: TrackerPick[];
  selectedDate: string | null;
  onClearDate: () => void;
  search: string;
  onSearch: (v: string) => void;
  outcome: OutcomeFilter;
  onOutcome: (v: OutcomeFilter) => void;
  page: number;
  onPage: (n: number) => void;
}) {
  const query = search.trim().toLowerCase();
  const rows = picks.filter(
    (p) =>
      (!selectedDate || p.date === selectedDate) &&
      (outcome === "all" || p.status === outcome) &&
      (!query ||
        p.selection.toLowerCase().includes(query) ||
        p.sport.toLowerCase().includes(query)),
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const start = current * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);

  return (
    <section className="card @container" aria-labelledby="history-title">
      <div className="mb-3 flex flex-col gap-3 @2xl:flex-row @2xl:items-end @2xl:justify-between">
        <div>
          <h2 id="history-title" className="m-0 text-[17px] font-semibold">
            Pick history
          </h2>
          <p className="m-0 text-xs text-muted">Newest first</p>
        </div>
        <div className="grid grid-cols-1 gap-3 @md:grid-cols-[1fr_auto]">
          <label className="grid gap-1 text-xs text-muted">
            Search history
            <input
              type="search"
              className="control"
              placeholder="Team, player or sport"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Outcome
            <select
              className="control"
              value={outcome}
              onChange={(e) => onOutcome(e.target.value as OutcomeFilter)}
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o === "all" ? "All outcomes" : statusLabel(o)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted" aria-live="polite">
        {selectedDate ? (
          <>
            {longDate(selectedDate)} only ·{" "}
            <button
              type="button"
              className="text-gold underline underline-offset-2"
              onClick={onClearDate}
            >
              show all dates
            </button>{" "}
            ·{" "}
          </>
        ) : (
          "All dates · "
        )}
        {rows.length} {rows.length === 1 ? "pick" : "picks"} shown. Search,
        outcome and date selection narrow this history only; summary metrics
        follow the filters at the top.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-control border border-dashed border-line px-4 py-8 text-center text-muted">
          No picks match these history filters.
        </div>
      ) : (
        <>
          {/* Table on wider containers */}
          <div
            className="hidden overflow-x-auto @2xl:block"
            role="region"
            aria-label="Pick history table"
            tabIndex={0}
          >
            <table className="w-full border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="border-b border-line px-3 py-3 font-medium">Date</th>
                  <th className="border-b border-line px-3 py-3 font-medium">Sport</th>
                  <th className="border-b border-line px-3 py-3 font-medium">Selection</th>
                  <th className="border-b border-line px-3 py-3 text-right font-medium">Odds</th>
                  <th className="border-b border-line px-3 py-3 text-right font-medium">Stake (u)</th>
                  <th className="border-b border-line px-3 py-3 font-medium">Result</th>
                  <th className="border-b border-line px-3 py-3 text-right font-medium">Net (u)</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const note = auditNote(p.notes);
                  return (
                    <tr key={p.id} className="align-top">
                      <td className="border-b border-line px-3 py-3">{longDate(p.date)}</td>
                      <td className="border-b border-line px-3 py-3">{p.sport}</td>
                      <td className="min-w-[220px] whitespace-normal border-b border-line px-3 py-3">
                        {p.selection}
                        {note && <span className="block text-xs text-muted">{note}</span>}
                      </td>
                      <td className="border-b border-line px-3 py-3 text-right">{formatOdds(p.americanOdds)}</td>
                      <td className="border-b border-line px-3 py-3 text-right">{formatStake(p.stakeUnits)}</td>
                      <td className="border-b border-line px-3 py-3">
                        <span className="badge">{statusLabel(p.status)}</span>
                      </td>
                      <td className="border-b border-line px-3 py-3 text-right font-semibold">
                        {p.netUnits === null ? "—" : formatUnits(p.netUnits)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards on narrow containers */}
          <ul className="m-0 list-none divide-y divide-line p-0 @2xl:hidden">
            {visible.map((p) => {
              const note = auditNote(p.notes);
              return (
                <li key={p.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 text-xs text-muted">
                        {longDate(p.date)} · {p.sport}
                      </p>
                      <p className="m-0 mt-0.5">{p.selection}</p>
                      {note && <p className="m-0 text-xs text-muted">{note}</p>}
                    </div>
                    <span className="badge flex-none">{statusLabel(p.status)}</span>
                  </div>
                  <dl className="m-0 mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted">Odds</dt>
                      <dd className="m-0">{formatOdds(p.americanOdds)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Stake</dt>
                      <dd className="m-0">{formatStake(p.stakeUnits)}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-muted">Net</dt>
                      <dd className="m-0 font-semibold">
                        {p.netUnits === null ? "—" : formatUnits(p.netUnits)}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>

          <nav
            className="mt-4 flex items-center justify-between gap-3"
            aria-label="Pick history pages"
          >
            <button
              type="button"
              className="control"
              disabled={current === 0}
              onClick={() => onPage(current - 1)}
            >
              Previous
            </button>
            <p className="m-0 text-xs text-muted">
              {start + 1}–{start + visible.length} of {rows.length}
            </p>
            <button
              type="button"
              className="control"
              disabled={current >= pageCount - 1}
              onClick={() => onPage(current + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
