export type PickResult = "win" | "loss" | "push" | "void" | "pending";

/** Daily pick log entry — follow this shape when adding picks. */
export interface Pick {
  /** Auto-generated UUID */
  id: string;
  /** Settled / game date as YYYY-MM-DD */
  date: string;
  /** Short description, e.g. "Lakers -4.5" or "Chiefs ML" */
  pick: string;
  /** Optional sport tag: NBA, NFL, MLB, NHL, NCAAB, etc. */
  sport?: string;
  /**
   * American odds only.
   * Examples: -110, -105, +150, +200
   */
  odds: number;
  /** Stake size in units (0.5, 1, 1.5, 2, …) */
  units: number;
  /** Outcome after the game settles */
  result: PickResult;
  /** Optional note */
  notes?: string;
}

export interface CreatePickInput {
  date: string;
  pick: string;
  sport?: string;
  odds: number;
  units: number;
  result: PickResult;
  notes?: string;
}
