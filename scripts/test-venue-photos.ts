/**
 * Plain assertion tests for the venue-photo fallback logic — the parts
 * that are fully testable without a live Google API key (which this
 * project doesn't have configured yet). Covers exactly the failure modes
 * the app must degrade gracefully through. Run with:
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
    "no currently-active venue has a googlePlaceId yet (Place IDs haven't been looked up against a real key)",
    VENUES.every((v) => !v.googlePlaceId),
    "if this fails because IDs were added, this assertion (and this comment) should be updated/removed"
  );

  const missingIdResult = await fetchVenuePhotos(anyRealVenue, {});
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

  process.env.GOOGLE_PLACES_API_KEY = originalKey;

  console.log(`\n${passed} passed, ${failures} failed.`);
  if (failures > 0) process.exit(1);
})();
