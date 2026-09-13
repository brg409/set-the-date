"use client";

// Local-storage-backed "saved dates" list. No account or backend required
// for the MVP — swap this module out for an API-backed store later without
// touching the components that call `useSavedVenues`.
//
// Exposed as a tiny external store (subscribe + snapshot) so components can
// read it with `useSyncExternalStore`, which is the correct primitive for
// state that lives outside React (here: localStorage).

const STORAGE_KEY = "setthedate:saved-venues";

const EMPTY_IDS: string[] = [];

let cachedIds: string[] = EMPTY_IDS;
let initialized = false;
const listeners = new Set<() => void>();

function loadFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function ensureInitialized() {
  if (!initialized && typeof window !== "undefined") {
    cachedIds = loadFromStorage();
    initialized = true;
  }
}

function persist(ids: string[]) {
  cachedIds = ids;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
  listeners.forEach((listener) => listener());
}

export function getSavedVenueIdsSnapshot(): string[] {
  ensureInitialized();
  return cachedIds;
}

export function getServerSavedVenueIdsSnapshot(): string[] {
  return EMPTY_IDS;
}

export function toggleSavedVenue(id: string): boolean {
  ensureInitialized();
  const ids = [...cachedIds];
  const index = ids.indexOf(id);
  const nowSaved = index === -1;
  if (index >= 0) {
    ids.splice(index, 1);
  } else {
    ids.push(id);
  }
  persist(ids);
  return nowSaved;
}

export function subscribeToSavedVenues(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = () => {
    cachedIds = loadFromStorage();
    listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}
