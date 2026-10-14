"use client";

// Local-storage-backed "My Places" store: want-to-go, been-there, favorites,
// plus a personal 1-5 rating and short note. No account or backend yet — the
// public surface here (read snapshot, mutate by venue id) is deliberately
// shaped so an API-backed implementation can replace it later without
// touching components.
//
// Exposed as a tiny external store (subscribe + snapshot) so components read
// it with `useSyncExternalStore`, the correct primitive for state living
// outside React.
//
// Ratings stored here are strictly the user's OWN. They are never summed or
// averaged into any "community" figure.

export interface PlaceEntry {
  venueId: string;
  wantToGo: boolean;
  visited: boolean;
  favorite: boolean;
  /** The user's own rating, 1-5. */
  rating?: number;
  /** The user's own short note. */
  review?: string;
  savedAt?: string;
  visitedAt?: string;
  /** The search (as URL params) this place was saved from, for "why we picked it" context. */
  fromSearch?: string;
}

export interface MyPlacesState {
  version: 1;
  entries: Record<string, PlaceEntry>;
}

const STORAGE_KEY = "knowaplace:my-places";
const LEGACY_SAVED_KEY = "knowaplace:saved-venues";

const EMPTY_STATE: MyPlacesState = { version: 1, entries: {} };

let cached: MyPlacesState = EMPTY_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function isEntry(value: unknown): value is PlaceEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PlaceEntry).venueId === "string"
  );
}

function load(): MyPlacesState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MyPlacesState>;
      if (parsed && typeof parsed === "object" && parsed.entries) {
        const entries: Record<string, PlaceEntry> = {};
        for (const [id, entry] of Object.entries(parsed.entries)) {
          if (isEntry(entry)) {
            entries[id] = {
              ...entry,
              wantToGo: Boolean(entry.wantToGo),
              visited: Boolean(entry.visited),
              favorite: Boolean(entry.favorite),
            };
          }
        }
        return { version: 1, entries };
      }
    }
    // First run on this store: carry over places saved before My Places
    // existed (a plain JSON array of venue ids) as "want to go". The old key
    // is left in place untouched.
    const legacy = window.localStorage.getItem(LEGACY_SAVED_KEY);
    if (legacy) {
      const ids = JSON.parse(legacy);
      if (Array.isArray(ids)) {
        const entries: Record<string, PlaceEntry> = {};
        for (const id of ids) {
          if (typeof id === "string") {
            entries[id] = { venueId: id, wantToGo: true, visited: false, favorite: false };
          }
        }
        const migrated: MyPlacesState = { version: 1, entries };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {
    // Corrupt or unavailable storage: start empty rather than crash.
  }
  return EMPTY_STATE;
}

function ensureInitialized() {
  if (!initialized && typeof window !== "undefined") {
    cached = load();
    initialized = true;
  }
}

function commit(next: MyPlacesState) {
  cached = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked: keep working in memory for this session.
    }
  }
  listeners.forEach((listener) => listener());
}

function isEmptyEntry(entry: PlaceEntry): boolean {
  return (
    !entry.wantToGo &&
    !entry.visited &&
    !entry.favorite &&
    entry.rating === undefined &&
    !entry.review
  );
}

function update(venueId: string, change: (current: PlaceEntry) => PlaceEntry) {
  ensureInitialized();
  const current: PlaceEntry = cached.entries[venueId] ?? {
    venueId,
    wantToGo: false,
    visited: false,
    favorite: false,
  };
  const nextEntry = change({ ...current });
  const entries = { ...cached.entries };
  if (isEmptyEntry(nextEntry)) {
    delete entries[venueId];
  } else {
    entries[venueId] = nextEntry;
  }
  commit({ version: 1, entries });
}

// ── Public API ───────────────────────────────────────────────────────────

export function getMyPlacesSnapshot(): MyPlacesState {
  ensureInitialized();
  return cached;
}

export function getServerMyPlacesSnapshot(): MyPlacesState {
  return EMPTY_STATE;
}

export function subscribeToMyPlaces(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cached = load();
    initialized = true;
    listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Save / unsave ("Want to go"). */
export function toggleWantToGo(venueId: string, fromSearch?: string): boolean {
  let now = false;
  update(venueId, (e) => {
    now = !e.wantToGo;
    return {
      ...e,
      wantToGo: now,
      savedAt: now ? new Date().toISOString() : e.savedAt,
      fromSearch: now && fromSearch ? fromSearch : e.fromSearch,
    };
  });
  return now;
}

/** Mark / unmark "Been here". Marking visited moves it out of "want to go". */
export function toggleVisited(venueId: string, fromSearch?: string): boolean {
  let now = false;
  update(venueId, (e) => {
    now = !e.visited;
    return {
      ...e,
      visited: now,
      wantToGo: now ? false : e.wantToGo,
      visitedAt: now ? new Date().toISOString() : e.visitedAt,
      fromSearch: now && fromSearch && !e.fromSearch ? fromSearch : e.fromSearch,
    };
  });
  return now;
}

export function toggleFavorite(venueId: string): boolean {
  let now = false;
  update(venueId, (e) => {
    now = !e.favorite;
    return { ...e, favorite: now };
  });
  return now;
}

export function setRating(venueId: string, rating: number | undefined): void {
  const clean =
    rating === undefined ? undefined : Math.min(5, Math.max(1, Math.round(rating)));
  update(venueId, (e) => ({ ...e, rating: clean }));
}

export function setReview(venueId: string, review: string): void {
  const clean = review.trim().slice(0, 500);
  update(venueId, (e) => ({ ...e, review: clean || undefined }));
}
