"use client";

import {
  formatOdds,
  formatStake,
  formatUnits,
  longDate,
  monthLabel,
  recordLine,
  statusLabel,
  type DayStat,
  type TrackerPick,
} from "@/lib/tracker-metrics";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthKeysBetween(from: string, to: string): string[] {
  const keys: string[] = [];
  let [y, m] = from.slice(0, 7).split("-").map(Number);
  const end = to.slice(0, 7);
  for (let i = 0; i < 240; i++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    keys.push(key);
    if (key >= end) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys;
}

function daysInMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function firstWeekday(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
}

function dayValue(d: DayStat | undefined) {
  if (!d) return "No picks";
  if (d.graded === 0) return "Pending";
  return formatUnits(d.netUnits);
}

function dotClass(d: DayStat | undefined) {
  if (!d || d.graded === 0 || Math.abs(d.netUnits) < 0.005) return null;
  return d.netUnits > 0 ? "bg-pos" : "bg-neg";
}

function weekdayOf(date: string) {
  return WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
}

export function DailyRecord({
  days,
  picks,
  rangeFrom,
  rangeTo,
  visibleMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
}: {
  days: DayStat[];
  picks: TrackerPick[];
  rangeFrom: string | null;
  rangeTo: string | null;
  visibleMonth: string | null;
  onMonthChange: (key: string) => void;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const months =
    rangeFrom && rangeTo ? monthKeysBetween(rangeFrom, rangeTo) : [];
  const fallback = days.length
    ? days[days.length - 1].date.slice(0, 7)
    : months[months.length - 1];
  const month =
    visibleMonth && months.includes(visibleMonth) ? visibleMonth : fallback;
  const idx = month ? months.indexOf(month) : -1;

  const selectedDay = selectedDate ? byDate.get(selectedDate) : undefined;
  const selectedPicks = selectedDate
    ? picks.filter((p) => p.date === selectedDate)
    : [];

  const monthDays = month
    ? days.filter((d) => d.date.startsWith(month)).slice().reverse()
    : [];

  return (
    <section className="card @container" aria-labelledby="daily-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="daily-title" className="m-0 text-[17px] font-semibold">
            Daily record
          </h2>
          <p className="m-0 text-xs text-muted">
            Select a date to inspect its picks. Summary metrics stay on the
            selected period.
          </p>
        </div>
        <button
          type="button"
          className="control"
          onClick={() => onSelectDate(null)}
          disabled={!selectedDate}
        >
          Show all dates
        </button>
      </div>

      {!month ? (
        <div className="flex h-[160px] items-center justify-center rounded-control border border-dashed border-line text-muted">
          No picks match these filters.
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              className="control"
              aria-label="Previous month"
              disabled={idx <= 0}
              onClick={() => onMonthChange(months[idx - 1])}
            >
              ‹
            </button>
            <p className="m-0 font-medium" aria-live="polite">
              {monthLabel(month)}
            </p>
            <button
              type="button"
              className="control"
              aria-label="Next month"
              disabled={idx === -1 || idx >= months.length - 1}
              onClick={() => onMonthChange(months[idx + 1])}
            >
              ›
            </button>
          </div>

          {/* Calendar grid on wider containers */}
          <div className="hidden grid-cols-7 gap-1.5 @lg:grid" role="group" aria-label={`${monthLabel(month)} calendar`}>
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-center text-[11px] text-muted">
                {w}
              </div>
            ))}
            {Array.from({ length: firstWeekday(month) }, (_, i) => (
              <div key={`pad-${i}`} aria-hidden />
            ))}
            {Array.from({ length: daysInMonth(month) }, (_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, "0")}`;
              const d = byDate.get(date);
              const dot = dotClass(d);
              const value = dayValue(d);
              if (!d) {
                return (
                  <div
                    key={date}
                    className="min-h-[72px] rounded-control border border-line/60 p-2"
                    aria-label={`${longDate(date)}: no picks`}
                  >
                    <span className="block text-[11px] text-muted">{i + 1}</span>
                  </div>
                );
              }
              const selected = selectedDate === date;
              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${longDate(date)}: ${value}, ${d.total} picks`}
                  onClick={() => onSelectDate(selected ? null : date)}
                  className={`min-h-[72px] rounded-control border p-2 text-left ${
                    selected
                      ? "border-gold bg-raised"
                      : "border-line bg-bg hover:bg-raised"
                  }`}
                >
                  <span className="block text-[11px] text-muted">{i + 1}</span>
                  <span className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold @3xl:text-[15px]">
                    {dot && <span className={`dot ${dot}`} aria-hidden />}
                    {value}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {d.total} {d.total === 1 ? "pick" : "picks"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List view on narrow containers */}
          <ul className="m-0 list-none divide-y divide-line p-0 @lg:hidden" aria-label={`${monthLabel(month)} days with picks`}>
            {monthDays.length === 0 && (
              <li className="py-3 text-muted">No picks this month.</li>
            )}
            {monthDays.map((d) => {
              const selected = selectedDate === d.date;
              const dot = dotClass(d);
              return (
                <li key={d.date}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelectDate(selected ? null : d.date)}
                    className={`flex w-full items-center justify-between gap-3 rounded-control px-2 py-2.5 text-left ${
                      selected ? "bg-raised outline outline-1 outline-gold" : ""
                    }`}
                  >
                    <span>
                      <span className="block font-medium">
                        {weekdayOf(d.date)}, {longDate(d.date)}
                      </span>
                      <span className="block text-xs text-muted">
                        {d.wins}W · {d.losses}L
                        {d.pushes ? ` · ${d.pushes}P` : ""}
                        {d.pending ? ` · ${d.pending} pending` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                      {dot && <span className={`dot ${dot}`} aria-hidden />}
                      {dayValue(d)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div aria-live="polite">
        {selectedDate && (
          <div className="mt-4 rounded-control border border-line bg-bg p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="m-0 text-[15px] font-semibold">
                {weekdayOf(selectedDate)}, {longDate(selectedDate)}
              </h3>
              {selectedDay && (
                <p className="m-0 text-xs text-muted">
                  {recordLine(selectedDay)}
                  {selectedDay.pending ? ` · ${selectedDay.pending} pending` : ""} ·{" "}
                  <span className="font-semibold text-ink">{dayValue(selectedDay)}</span>
                </p>
              )}
            </div>
            <ul className="m-0 mt-3 list-none divide-y divide-line p-0">
              {selectedPicks.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block">{p.selection}</span>
                    <span className="block text-xs text-muted">
                      {p.sport} · {formatOdds(p.americanOdds)} · {formatStake(p.stakeUnits)}
                    </span>
                  </span>
                  <span className="flex flex-none flex-col items-end gap-1">
                    <span className="badge">{statusLabel(p.status)}</span>
                    <span className="text-xs font-semibold">
                      {p.netUnits === null ? "—" : formatUnits(p.netUnits)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
