// Product analytics, sent to PostHog. Page views, visitors and devices come
// from Vercel Web Analytics (see layout.tsx); this file covers only the
// KnowaPlace events listed in docs/ANALYTICS.md.
//
// Privacy rules, enforced here rather than at each call site:
// - No cookies or browser storage, no person profiles, no identify().
// - No session recording, autocapture, heatmaps, surveys, page views or
//   performance data; nothing loads from PostHog beyond the event endpoint.
// - Properties are only fixed filter values, our own venue ids, counts and
//   positions. Never ratings, notes, form contents or anything typed.
// - Without NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN every call here does nothing.

// Imports stay minimal: this file loads before the app on every page.
import posthog from "posthog-js";
import { LINK_EVENTS, LINK_SOURCES } from "./trackLink";
import type { DatePreferences, ExpansionState, NotForMeReason } from "./types";

type Value = string | number | boolean;

const TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
// Events go through this site's /ingest rewrite (next.config.ts) so content
// blockers that block posthog.com don't silently drop them.
const API_HOST = "/ingest";
// Links in PostHog's toolbar/debug output: the app host for this region.
const UI_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(".i.posthog.com", ".posthog.com");

export function initAnalytics(): void {
  if (!TOKEN || typeof window === "undefined" || posthog.__loaded) return;
  posthog.init(TOKEN, {
    api_host: API_HOST,
    ui_host: UI_HOST,
    defaults: "2026-08-30",
    // Anonymous, storage-free counting. Needs "Cookieless server hash mode"
    // on in the PostHog project, or PostHog ignores these events.
    cookieless_mode: "always",
    person_profiles: "never",
    persistence: "memory",
    disable_persistence: true,
    disable_cookie: true,
    // Only the events below are sent.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_performance: false,
    capture_exceptions: false,
    rageclick: false,
    disable_scroll_properties: true,
    disable_session_recording: true,
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
    disable_web_experiments: true,
    advanced_disable_flags: true,
    disable_external_dependency_loading: true,
    save_referrer: false,
    mask_personal_data_properties: true,
  });
}

function capture(event: string, props: Record<string, Value>): void {
  if (!posthog.__loaded) return;
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics must never break the page.
  }
}

/** The filters a search used, as fixed option ids. */
function searchProps(prefs: DatePreferences): Record<string, string> {
  const occasion = prefs.dateType;
  const vibe = prefs.vibe;
  const neighborhood = prefs.neighborhood;
  const budget = "$".repeat(prefs.budget);
  const outing = prefs.filters?.outing ?? "anything";
  const indoor_outdoor = prefs.filters?.indoorOutdoor ?? "any";
  const food = prefs.filters?.food ?? "any";
  return {
    occasion,
    vibe,
    neighborhood,
    budget,
    outing,
    indoor_outdoor,
    food,
    // One value per combination, for "most searched combinations".
    combination: [occasion, vibe, neighborhood, budget, outing, indoor_outdoor, food].join(" | "),
  };
}

/** A new search reached the results page. */
export function trackSearch(prefs: DatePreferences, exactMatches: number): void {
  capture("search", {
    ...searchProps(prefs),
    exact_matches: exactMatches,
    few_matches: exactMatches < 3,
  });
}

/** The visitor chose to widen a search. */
export function trackSearchWidened(prefs: DatePreferences, widened: keyof ExpansionState, exactMatches: number): void {
  capture("search_widened", { ...searchProps(prefs), widened, exact_matches: exactMatches });
}

/** One venue appeared in a set of recommendations. */
export function trackRecommendationShown(
  venueId: string,
  info: { position: number; set: number; widened: boolean },
): void {
  capture("recommendation_shown", { venue_id: venueId, ...info });
}

export type PlaceSource = "search" | "my-places" | "home" | "direct";

/** A place's own page was opened. */
export function trackPlaceViewed(venueId: string, source: PlaceSource): void {
  capture("place_viewed", { venue_id: venueId, source });
}

/** Saved to Want to Go. Removals are not tracked. */
export function trackPlaceSaved(venueId: string): void {
  capture("place_saved", { venue_id: venueId });
}

/**
 * "Not for me" on a result card: the venue, the reason code the visitor
 * picked ("none" when they skipped it), and the search it was shown for.
 */
export function trackNotForMe(
  venueId: string,
  reason: NotForMeReason | null,
  prefs: DatePreferences,
  position: number,
): void {
  capture("not_for_me", { venue_id: venueId, reason: reason ?? "none", position, ...searchProps(prefs) });
}

/** Added to Favorites (the heart). Removals are not tracked. */
export function trackFavorited(venueId: string): void {
  capture("place_favorited", { venue_id: venueId });
}

/** Marked Been There. Ratings and notes are never sent. */
export function trackBeenThere(venueId: string): void {
  capture("been_there", { venue_id: venueId });
}

const LINK_EVENT_SET = new Set<string>(LINK_EVENTS);
const LINK_SOURCE_SET = new Set<string>(LINK_SOURCES);
const VENUE_ID = /^[a-z0-9-]{1,100}$/;

/** Reserve / Website / Directions clicks, from the attributes set by trackLinkProps(). */
export function listenForTrackedLinks(): void {
  if (!TOKEN || typeof document === "undefined") return;
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      if (!(el instanceof HTMLElement)) return;
      const event = el.dataset.track ?? "";
      const venueId = el.dataset.venueId ?? "";
      const from = el.dataset.trackFrom ?? "";
      if (!LINK_EVENT_SET.has(event) || !VENUE_ID.test(venueId) || !LINK_SOURCE_SET.has(from)) return;
      capture(event, { venue_id: venueId, from });
    },
    { capture: true },
  );
}
