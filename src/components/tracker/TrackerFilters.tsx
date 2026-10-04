"use client";

import {
  presetLabel,
  type FilterState,
  type RangePreset,
} from "./filter-state";

const PRESETS: RangePreset[] = ["all", "this-month", "last-month", "custom"];

export function TrackerFilters({
  filters,
  sports,
  minDate,
  maxDate,
  activeRange,
  onChange,
  onReset,
  onExport,
  exportDisabled,
}: {
  filters: FilterState;
  sports: string[];
  minDate: string | null;
  maxDate: string | null;
  activeRange: string;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  onExport: () => void;
  exportDisabled: boolean;
}) {
  const setPreset = (preset: RangePreset) => {
    if (preset === "custom") {
      onChange({
        ...filters,
        preset,
        from: filters.from ?? minDate,
        to: filters.to ?? maxDate,
      });
    } else {
      onChange({ ...filters, preset, from: null, to: null });
    }
  };

  return (
    <section aria-label="Filters" className="@container">
      <div className="flex flex-col gap-3 @xl:flex-row @xl:flex-wrap @xl:items-end">
        <label className="grid gap-1 text-xs text-muted @xl:min-w-[160px]">
          Period
          <select
            className="control"
            value={filters.preset}
            onChange={(e) => setPreset(e.target.value as RangePreset)}
          >
            {PRESETS.map((p) => (
              <option key={p} value={p}>
                {presetLabel(p)}
              </option>
            ))}
          </select>
        </label>

        {filters.preset === "custom" && (
          <div className="grid grid-cols-2 gap-3 @xl:flex">
            <label className="grid gap-1 text-xs text-muted">
              From
              <input
                type="date"
                className="control"
                value={filters.from ?? ""}
                min={minDate ?? undefined}
                max={filters.to ?? maxDate ?? undefined}
                onChange={(e) =>
                  onChange({ ...filters, from: e.target.value || null })
                }
              />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              To
              <input
                type="date"
                className="control"
                value={filters.to ?? ""}
                min={filters.from ?? minDate ?? undefined}
                max={maxDate ?? undefined}
                onChange={(e) =>
                  onChange({ ...filters, to: e.target.value || null })
                }
              />
            </label>
          </div>
        )}

        <label className="grid gap-1 text-xs text-muted @xl:min-w-[160px]">
          Sport
          <select
            className="control"
            value={filters.sport ?? "all"}
            onChange={(e) =>
              onChange({
                ...filters,
                sport: e.target.value === "all" ? null : e.target.value,
              })
            }
          >
            <option value="all">All sports</option>
            {sports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3 @xl:ml-auto @xl:flex">
          <button type="button" className="control" onClick={onReset}>
            Reset filters
          </button>
          <button
            type="button"
            className="control"
            onClick={onExport}
            disabled={exportDisabled}
          >
            Export CSV
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted" aria-live="polite">
        Showing <span className="text-ink">{presetLabel(filters.preset)}</span>{" "}
        · {activeRange} ·{" "}
        <span className="text-ink">{filters.sport ?? "All sports"}</span>
      </p>
    </section>
  );
}
