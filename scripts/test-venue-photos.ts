/**
 * Plain assertion tests for the venue-photo fallback logic and the
 * googlePlaceId dataset. Deliberately does not make any real network call
 * to Google — see the browser-based manual test steps in the completion
 * notes for verifying an actual photo renders. Run with:
 *   npx tsx scripts/test-venue-photos.ts
 */
import { VENUES, getVenueById } from "../src/data/venues";
import { fetchVenuePhotos } from "../src/lib/googlePlaces";

let failures = 0;
let passed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

const originalKey = process.env.GOOGLE_PLACES_API_KEY;

// A venue deliberately left without a googlePlaceId (see the comment on it
// in src/data/venues.ts for why) — used below to test the "missing place
// ID" path without depending on which venues happen to have one looked up.
const venueMissingPlaceId = getVenueById("upstairs-at-abyssinia")!;

// ── 1. No API key configured — the app must stay fully functional ──────

section("No API key configured");
delete process.env.GOOGLE_PLACES_API_KEY;

const anyRealVenue = VENUES.find((v) => v.lastVerified)!;

(async () => {
  const noKeyResult = await fetchVenuePhotos(anyRealVenue, {});
  check(
    'returns { available: false, reason: "no_api_key" } with no key set',
    !noKeyResult.available && noKeyResult.reason === "no_api_key",
    JSON.stringify(noKeyResult)
  );

  // ── 2. API key present, but venue has no googlePlaceId ────────────────
  section("API key present, venue missing googlePlaceId");
  process.env.GOOGLE_PLACES_API_KEY = "fake-test-key-not-a-real-credential";

  check(
    "the test venue for this case genuinely has no googlePlaceId",
    !venueMissingPlaceId.googlePlaceId
  );

  const missingIdResult = await fetchVenuePhotos(venueMissingPlaceId, {});
  check(
    'returns { available: false, reason: "no_place_id" } when googlePlaceId is unset, even with a key present',
    !missingIdResult.available && missingIdResult.reason === "no_place_id",
    JSON.stringify(missingIdResult)
  );

  // ── 3. Unknown venue ID never reaches Google at all ───────────────────

  section("Unknown venue ID (route-level guard)");
  check("getVenueById returns undefined for a made-up ID", getVenueById("not-a-real-venue-id") === undefined);

  // ── 4. Every real venue has the fields the photo pipeline depends on ──

  section("Schema sanity");
  const realVenues = VENUES.filter((v) => v.lastVerified);
  check(`${realVenues.length} real (lastVerified) venues found`, realVenues.length === 100, `expected 100, got ${realVenues.length}`);
  check(
    "no fictional (non-lastVerified) venue has a googlePlaceId set",
    VENUES.filter((v) => !v.lastVerified).every((v) => !v.googlePlaceId)
  );
  const withId = realVenues.filter((v) => v.googlePlaceId);
  const withoutId = realVenues.filter((v) => !v.googlePlaceId);
  check(
    `99 real venues have a verified googlePlaceId, 1 pending manual verification`,
    withId.length === 99 && withoutId.length === 1,
    `${withId.length} with, ${withoutId.length} without: ${withoutId.map((v) => v.id).join(", ")}`
  );
  check(
    "every googlePlaceId looks like a real Places API (New) ID (starts with 'ChIJ')",
    withId.every((v) => v.googlePlaceId!.startsWith("ChIJ"))
  );

  process.env.GOOGLE_PLACES_API_KEY = originalKey;

  console.log(`\n${passed} passed, ${failures} failed.`);
  if (failures > 0) process.exit(1);
})();
