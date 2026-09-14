/**
 * One-time (or re-run-as-needed) helper: looks up a Google Place ID for
 * every real, verified venue that doesn't have one yet, using Places API
 * (New) Text Search. Requires GOOGLE_PLACES_API_KEY to be set.
 *
 * This deliberately does NOT auto-write the results into venues.ts — a
 * text-search match can be wrong (wrong location with a similar name, a
 * permanently-closed duplicate listing, etc.), and silently trusting it
 * would violate the same "verify, don't guess" standard the rest of this
 * dataset was built to. Instead it prints a reviewable report; a human
 * copies each confirmed googlePlaceId into the matching venue by hand.
 *
 * Run with: npx tsx scripts/lookup-place-ids.ts [neighborhood]
 * (omit the neighborhood to check every real venue that's missing one)
 */
import fs from "node:fs";
import path from "node:path";
import { VENUES } from "../src/data/venues";
import type { Neighborhood } from "../src/lib/types";

// Plain scripts run via `tsx` don't get Next.js's automatic .env.local
// loading, so read it directly here rather than adding a dotenv
// dependency just for this one script.
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}
loadEnvLocal();

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_PLACES_API_KEY is not set. Add it to .env.local first (see .env.example).");
  process.exit(1);
}

const neighborhoodFilter = process.argv[2] as Neighborhood | undefined;

const candidates = VENUES.filter((v) => v.lastVerified && !v.googlePlaceId).filter(
  (v) => !neighborhoodFilter || v.neighborhood === neighborhoodFilter
);

console.log(`Looking up ${candidates.length} venue(s)${neighborhoodFilter ? ` in ${neighborhoodFilter}` : ""}...\n`);

interface TextSearchPlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
}

async function textSearch(query: string): Promise<TextSearchPlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey!,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
  });
  if (!res.ok) {
    throw new Error(`Text search failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { places?: TextSearchPlace[] };
  return data.places ?? [];
}

async function main() {
  for (const venue of candidates) {
    try {
      const results = await textSearch(`${venue.name}, ${venue.address}`);
      if (results.length === 0) {
        console.log(`  ✗ ${venue.name} (${venue.id}) — no results`);
        continue;
      }
      const top = results[0];
      console.log(`  ${venue.name} (${venue.id})`);
      console.log(`    our address:    ${venue.address}`);
      console.log(`    best match:     ${top.displayName?.text ?? "?"} — ${top.formattedAddress ?? "?"}`);
      console.log(`    googlePlaceId:  ${top.id}`);
      if (results.length > 1) {
        console.log(`    (${results.length - 1} other candidate(s) found — double-check this is the right one before using it)`);
      }
      console.log();
    } catch (err) {
      console.log(`  ✗ ${venue.name} (${venue.id}) — ${err instanceof Error ? err.message : String(err)}`);
    }
    // Basic pacing to stay well under any rate limit while looping ~100 venues.
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log("Done. Review each match above, then set `googlePlaceId` on the matching venue in src/data/venues.ts by hand.");
}

main();
