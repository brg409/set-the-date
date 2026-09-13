"use client";

// Lightweight local storage for "Not for me" feedback. Not wired into
// ranking yet — kept structured (venue, reason, and the preferences that
// were active) so a future version can use it to personalize results
// without changing this shape.

import type { DatePreferences, NotForMeReason, VenueFeedback } from "./types";

const STORAGE_KEY = "setthedate:venue-feedback";

function readAll(): VenueFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordNotForMe(
  venueId: string,
  reason: NotForMeReason | null,
  prefs: DatePreferences
): void {
  if (typeof window === "undefined") return;
  const entry: VenueFeedback = {
    venueId,
    reason,
    dateType: prefs.dateType,
    vibe: prefs.vibe,
    neighborhood: prefs.neighborhood,
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.push(entry);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getAllFeedback(): VenueFeedback[] {
  return readAll();
}
