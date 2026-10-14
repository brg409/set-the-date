import { getVenueById } from "@/data/venues";
import {
  generateWhyItFits,
  getRecommendations,
  getReplacementVenue,
  rankVenue,
} from "./recommend";
import type { DatePreferences, ExpansionState, ScoredVenue } from "./types";

/**
 * Everything the results screen needs to put the user back exactly where
 * they were: every set of three they've been shown, which one is on screen,
 * which venues they dismissed, and which filters they chose to widen.
 *
 * Kept per search (keyed by the URL params) in sessionStorage. It stores
 * venue ids only — scores and "why we picked it" copy are rebuilt from the
 * untouched engine functions, so nothing here can drift from the data.
 */
export interface ResultSession {
  sets: string[][];
  cursor: number;
  excluded: string[];
  expand: ExpansionState;
}

export const NO_EXPANSION: ExpansionState = {
  neighborhood: false,
  budget: false,
  indoorOutdoor: false,
  food: false,
};

const keyFor = (paramsKey: string) => `knowaplace:results:${paramsKey}`;

export function loadResultSession(paramsKey: string): ResultSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(keyFor(paramsKey));
    if (!raw) return null;
    const s = JSON.parse(raw) as ResultSession;
    const idsOk = (ids: unknown) =>
      Array.isArray(ids) && ids.every((id) => typeof id === "string" && getVenueById(id));
    if (
      !Array.isArray(s.sets) ||
      s.sets.length === 0 ||
      !s.sets.every(idsOk) ||
      !idsOk(s.excluded) ||
      typeof s.cursor !== "number" ||
      s.cursor < 0 ||
      s.cursor >= s.sets.length
    ) {
      return null;
    }
    return { ...s, expand: { ...NO_EXPANSION, ...s.expand } };
  } catch {
    return null;
  }
}

export function saveResultSession(paramsKey: string, session: ResultSession): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(keyFor(paramsKey), JSON.stringify(session));
  } catch {
    // Storage unavailable: results still work, they just won't survive a reload.
  }
}

/** The first three for a search, exactly what the engine returns. */
export function freshSession(prefs: DatePreferences, expand: ExpansionState = NO_EXPANSION): ResultSession {
  const first = getRecommendations(prefs, { expand, count: 3 }).results;
  return { sets: [first.map((r) => r.venue.id)], cursor: 0, excluded: [], expand };
}

/** Rebuilds display objects from ids using the engine's own scoring and copy. */
export function hydrateSet(ids: string[], prefs: DatePreferences): ScoredVenue[] {
  const out: ScoredVenue[] = [];
  for (const id of ids) {
    const venue = getVenueById(id);
    if (!venue) continue;
    out.push({
      venue,
      score: rankVenue(venue, prefs),
      whyItFits: generateWhyItFits(venue, prefs),
      matchedTags: venue.tags.slice(0, 3),
    });
  }
  return out;
}

/**
 * The next set of up to three for "Show Me 3 More".
 *
 * Normally the engine returns three venues not yet seen. When fewer than
 * three unseen venues remain it restarts its rotation (by design) instead of
 * returning the leftovers — so in that case the leftovers are gathered here,
 * one at a time, through the engine's no-wraparound replacement lookup.
 * Only when truly nothing unseen remains does the engine's restart apply.
 */
export function nextSet(
  prefs: DatePreferences,
  expand: ExpansionState,
  seenIds: string[]
): string[] {
  const seen = new Set(seenIds);
  const batch = getRecommendations(prefs, { expand, excludeIds: seenIds, count: 3 }).results;
  if (batch.length > 0 && batch.every((r) => !seen.has(r.venue.id))) {
    return batch.map((r) => r.venue.id);
  }

  const leftovers: string[] = [];
  const exclude = [...seenIds];
  for (let i = 0; i < 3; i++) {
    const next = getReplacementVenue(prefs, expand, exclude);
    if (!next) break;
    leftovers.push(next.venue.id);
    exclude.push(next.venue.id);
  }
  if (leftovers.length > 0) return leftovers;

  return batch.map((r) => r.venue.id);
}
