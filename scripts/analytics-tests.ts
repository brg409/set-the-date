/**
 * Tests for the PostHog events in src/lib/analytics.ts: each event carries
 * only the agreed properties (fixed filter values, venue ids, counts), and
 * nothing is sent before PostHog is started.
 *
 * Run with: npm run test:analytics
 */

import posthog from "posthog-js";
import {
  trackBeenThere,
  trackFavorited,
  trackNotForMe,
  trackPlaceSaved,
  trackPlaceViewed,
  trackRecommendationShown,
  trackSearch,
  trackSearchWidened,
} from "../src/lib/analytics";
import { trackLinkProps } from "../src/lib/trackLink";
import type { DatePreferences } from "../src/lib/types";

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

// Stand in for PostHog: record what would be sent.
const sent: { event: string; props: Record<string, unknown> }[] = [];
const ph = posthog as unknown as { __loaded: boolean; capture: (e: string, p: Record<string, unknown>) => void };
ph.capture = (event, props) => void sent.push({ event, props });

function lastSent() {
  return sent[sent.length - 1];
}
function keysOf(props: Record<string, unknown>) {
  return Object.keys(props).sort().join(",");
}

const prefs: DatePreferences = {
  dateType: "anniversary",
  vibe: "romantic",
  neighborhood: "old_city",
  budget: 3,
  filters: { outing: "dinner", indoorOutdoor: "outdoor" },
};
const plain: DatePreferences = { dateType: "casual", vibe: "lively_social", neighborhood: "fishtown", budget: 1 };

console.log("Before PostHog starts");
ph.__loaded = false;
trackSearch(prefs, 5);
trackPlaceSaved("parc");
check("nothing is sent", sent.length === 0, `${sent.length} sent`);

ph.__loaded = true;

console.log("search");
trackSearch(prefs, 2);
check(
  "only filter values, counts and the combination",
  keysOf(lastSent().props) ===
    "budget,combination,exact_matches,few_matches,food,indoor_outdoor,neighborhood,occasion,outing,vibe",
  keysOf(lastSent().props),
);
check("budget is a $ label", lastSent().props.budget === "$$$");
check("fewer than 3 matches is flagged", lastSent().props.few_matches === true && lastSent().props.exact_matches === 2);
check(
  "combination lists every filter",
  lastSent().props.combination === "anniversary | romantic | old_city | $$$ | dinner | outdoor | any",
  String(lastSent().props.combination),
);
trackSearch(plain, 7);
check("unset filters read as anything/any", lastSent().props.outing === "anything" && lastSent().props.indoor_outdoor === "any" && lastSent().props.food === "any");
check("3+ matches is not flagged", lastSent().props.few_matches === false);

console.log("search_widened");
trackSearchWidened(prefs, "neighborhood", 1);
check("names the widening", lastSent().event === "search_widened" && lastSent().props.widened === "neighborhood");

console.log("recommendation_shown, place_viewed, place_saved, been_there");
trackRecommendationShown("parc", { position: 2, set: 1, widened: false });
check("recommendation: venue, position, set, widened", keysOf(lastSent().props) === "position,set,venue_id,widened");
trackPlaceViewed("parc", "search");
check("place_viewed: venue and source", keysOf(lastSent().props) === "source,venue_id");
trackPlaceSaved("parc");
check("place_saved: venue only", lastSent().event === "place_saved" && keysOf(lastSent().props) === "venue_id");
trackBeenThere("parc");
check("been_there: venue only (no rating or note)", lastSent().event === "been_there" && keysOf(lastSent().props) === "venue_id");
trackFavorited("parc");
check("place_favorited: venue only", lastSent().event === "place_favorited" && keysOf(lastSent().props) === "venue_id");

console.log("not_for_me");
trackNotForMe("parc", "too_expensive", prefs, 2);
check(
  "venue, reason, position and the search's filters",
  lastSent().event === "not_for_me" &&
    keysOf(lastSent().props) ===
      "budget,combination,food,indoor_outdoor,neighborhood,occasion,outing,position,reason,venue_id,vibe",
  keysOf(lastSent().props),
);
check("reason is the fixed code", lastSent().props.reason === "too_expensive" && lastSent().props.position === 2);
trackNotForMe("parc", null, plain, 1);
check("a skipped reason is sent as \"none\"", lastSent().props.reason === "none");

console.log("Every event");
const allowed = /^(occasion|vibe|neighborhood|budget|outing|indoor_outdoor|food|combination|exact_matches|few_matches|widened|venue_id|position|set|source|reason)$/;
const stray = sent.flatMap((s) => Object.keys(s.props).filter((k) => !allowed.test(k)));
check("no property outside the agreed list", stray.length === 0, stray.join(", "));
const values = sent.flatMap((s) => Object.values(s.props));
check("values are only strings, numbers and booleans", values.every((v) => ["string", "number", "boolean"].includes(typeof v)));

console.log("Outbound link attributes");
const attrs = trackLinkProps("reserve_click", "parc", "results");
check(
  "reserve link carries event, venue and source",
  attrs["data-track"] === "reserve_click" && attrs["data-venue-id"] === "parc" && attrs["data-track-from"] === "results",
);
const directions = trackLinkProps("directions_click", "parc", "place");
check("directions link carries its own event", directions["data-track"] === "directions_click" && directions["data-track-from"] === "place");

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
