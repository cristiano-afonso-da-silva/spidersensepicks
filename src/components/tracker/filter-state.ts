"use client";

import { useCallback, useSyncExternalStore } from "react";
import { longDate, type TrackerFilter } from "@/lib/tracker-metrics";

export type RangePreset = "all" | "this-month" | "last-month" | "custom";

export interface FilterState {
  preset: RangePreset;
  /** Only used when preset is "custom" */
  from: string | null;
  to: string | null;
  sport: string | null;
}

export const DEFAULT_FILTERS: FilterState = {
  preset: "all",
  from: null,
  to: null,
  sport: null,
};

const PRESETS: RangePreset[] = ["all", "this-month", "last-month", "custom"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

function parseFilters(search: string, sports: string[]): FilterState {
  const params = new URLSearchParams(search);
  const preset = params.get("range") as RangePreset | null;
  const from = params.get("from");
  const to = params.get("to");
  const sport = params.get("sport");
  const state: FilterState = {
    preset: preset && PRESETS.includes(preset) ? preset : "all",
    from: from && DATE_RE.test(from) ? from : null,
    to: to && DATE_RE.test(to) ? to : null,
    sport: sport && sports.includes(sport) ? sport : null,
  };
  if (state.preset !== "custom") {
    state.from = null;
    state.to = null;
  } else if (state.from && state.to && state.from > state.to) {
    [state.from, state.to] = [state.to, state.from];
  }
  return state;
}

function serializeFilters(f: FilterState): string {
  const params = new URLSearchParams();
  if (f.preset !== "all") params.set("range", f.preset);
  if (f.preset === "custom") {
    if (f.from) params.set("from", f.from);
    if (f.to) params.set("to", f.to);
  }
  if (f.sport) params.set("sport", f.sport);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Filter state lives in the URL so a filtered view can be shared or reloaded. */
export function useFilterState(sports: string[]) {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const filters = parseFilters(search, sports);

  const setFilters = useCallback((next: FilterState) => {
    const url = `${window.location.pathname}${serializeFilters(next)}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", url);
    listeners.forEach((l) => l());
  }, []);

  return [filters, setFilters] as const;
}

export function torontoToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function monthBounds(year: number, monthIndex: number) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

export function resolveFilter(f: FilterState): TrackerFilter {
  if (f.preset === "all") return { from: null, to: null, sport: f.sport };
  if (f.preset === "custom") return { from: f.from, to: f.to, sport: f.sport };
  const [y, m] = torontoToday().split("-").map(Number);
  const offset = f.preset === "this-month" ? 0 : -1;
  return { ...monthBounds(y, m - 1 + offset), sport: f.sport };
}

export function presetLabel(p: RangePreset): string {
  return {
    all: "All time",
    "this-month": "This month",
    "last-month": "Last month",
    custom: "Custom range",
  }[p];
}

export function rangeText(
  filter: TrackerFilter,
  firstDate: string | null,
  lastDate: string | null,
): string {
  const from = filter.from ?? firstDate;
  const to = filter.to ?? lastDate;
  if (!from && !to) return "No dates";
  if (from && to) return `${longDate(from)} – ${longDate(to)}`;
  return from ? `From ${longDate(from)}` : `Through ${longDate(to!)}`;
}
