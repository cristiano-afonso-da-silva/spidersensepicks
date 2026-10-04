import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CreatePickInput, Pick } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "picks.json");

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, "[]\n", "utf8");
  }
}

/** Make hand-edited odds like `"odds": +125` valid before JSON.parse. */
function sanitizePicksJson(raw: string): string {
  return raw.replace(/("odds"\s*:\s*)\+(\d+)/g, "$1$2");
}

export function parseOdds(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/^\+/, "");
    return Number(cleaned);
  }
  return Number.NaN;
}

export async function readPicks(): Promise<Pick[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_PATH, "utf8");
  let parsed: Pick[];
  try {
    parsed = JSON.parse(raw) as Pick[];
  } catch {
    // Recover from invalid `+150` odds written by hand in picks.json
    const fixed = sanitizePicksJson(raw);
    parsed = JSON.parse(fixed) as Pick[];
    await writePicks(parsed);
  }
  return parsed.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return b.id.localeCompare(a.id);
  });
}

async function writePicks(picks: Pick[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(DATA_PATH, `${JSON.stringify(picks, null, 2)}\n`, "utf8");
}

function validateInput(input: CreatePickInput): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return "date must be YYYY-MM-DD";
  }
  if (!input.pick?.trim()) return "pick is required";
  if (typeof input.odds !== "number" || Number.isNaN(input.odds) || input.odds === 0) {
    return "odds must be non-zero American odds (e.g. -110 or +150)";
  }
  if (typeof input.units !== "number" || Number.isNaN(input.units) || input.units <= 0) {
    return "units must be a positive number";
  }
  if (!["win", "loss", "push", "pending"].includes(input.result)) {
    return "result must be win, loss, push, or pending";
  }
  return null;
}

export async function createPick(input: CreatePickInput): Promise<Pick> {
  const error = validateInput(input);
  if (error) throw new Error(error);

  const picks = await readPicks();
  const pick: Pick = {
    id: randomUUID(),
    date: input.date,
    pick: input.pick.trim(),
    sport: input.sport?.trim() || undefined,
    odds: input.odds,
    units: input.units,
    result: input.result,
    notes: input.notes?.trim() || undefined,
  };
  picks.push(pick);
  await writePicks(picks);
  return pick;
}

export async function updatePick(
  id: string,
  patch: Partial<CreatePickInput>,
): Promise<Pick> {
  const picks = await readPicks();
  const idx = picks.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Pick not found");

  const next: Pick = {
    ...picks[idx],
    ...patch,
    pick: patch.pick?.trim() ?? picks[idx].pick,
    sport: patch.sport !== undefined ? patch.sport.trim() || undefined : picks[idx].sport,
    notes: patch.notes !== undefined ? patch.notes.trim() || undefined : picks[idx].notes,
  };

  const error = validateInput(next);
  if (error) throw new Error(error);

  picks[idx] = next;
  await writePicks(picks);
  return next;
}

export async function deletePick(id: string): Promise<void> {
  const picks = await readPicks();
  const next = picks.filter((p) => p.id !== id);
  if (next.length === picks.length) throw new Error("Pick not found");
  await writePicks(next);
}
