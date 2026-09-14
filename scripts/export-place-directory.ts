/**
 * One-off, read-only export: dumps the full current venue dataset plus a
 * written description of the recommendation engine's filters/scoring/
 * fallback logic into a single JSON file. Does not modify venues.ts,
 * recommend.ts, or any other app code — pure read + serialize.
 *
 * Run with: npx tsx scripts/export-place-directory.ts <output-path>
 */
import fs from "node:fs";
import { VENUES } from "../src/data/venues";

const outPath = process.argv[2];
if (!outPath) {
  console.error("Usage: npx tsx scripts/export-place-directory.ts <output-path>");
  process.exit(1);
}

// ── Validate: every place accounted for, broken down by neighborhood ──────
const NEIGHBORHOODS = [
  "rittenhouse",
  "center_city",
  "old_city",
  "fishtown",
  "university_city",
  "south_philly",
] as const;

const countByNeighborhood: Record<string, number> = {};
for (const n of NEIGHBORHOODS) countByNeighborhood[n] = 0;
for (const v of VENUES) {
  if (!(v.neighborhood in countByNeighborhood)) {
    countByNeighborhood[v.neighborhood] = 0;
  }
  countByNeighborhood[v.neighborhood]++;
}

const unexpectedNeighborhoods = Object.keys(countByNeighborhood).filter(
  (n) => !(NEIGHBORHOODS as readonly string[]).includes(n)
);

// ── The directory itself: every field, unmodified, exact names/values ────
// Deliberately a direct pass-through of the actual Venue objects (not
// remapped/renamed) so field names and tag values are guaranteed identical
// to what the recommendation engine reads at runtime.
const places = VENUES;

const output = {
  exportMetadata: {
    generatedAt: new Date().toISOString(),
    sourceFile: "src/data/venues.ts",
    totalPlaces: VENUES.length,
    placesByNeighborhood: countByNeighborhood,
    unexpectedNeighborhoodValues: unexpectedNeighborhoods, // should be empty
    note:
      "This is a read-only export for reference/analysis. It does not feed back into the app — the live recommendation engine still reads directly from src/data/venues.ts. No data or logic was changed to produce this file.",
  },

  places,

  filterInputs: {
    description:
      "The four required inputs plus two optional inputs a user can set via the /plan wizard. Values shown are the exact enum/type values used in code (see src/lib/types.ts) — the UI labels in src/lib/options.ts are display-only strings for the same values.",
    required: {
      dateType: {
        type: "DateType",
        possibleValues: [
          "first_date",
          "casual",
          "anniversary",
          "special_occasion",
          "reconnecting",
          "surprise_me",
        ],
        mapsTo:
          "Soft-scored (not a hard filter) against each venue's `dateTypes: DateType[]` array. See 'Ranking logic' below for exact scoring. 'surprise_me' has no matching requirement at all — every eligible venue is treated as a genuine match for it by design.",
      },
      vibe: {
        type: "Vibe",
        possibleValues: [
          "cozy_intimate",
          "relaxed_casual",
          "lively_social",
          "romantic",
          "fun_playful",
          "trendy",
          "something_different",
        ],
        mapsTo:
          "Soft-scored (not a hard filter) against each venue's `vibes: Vibe[]` array, plus vibe-specific secondary-attribute bonuses (e.g. romantic scoring also weighs `attributes.romantic`, `attributes.lighting`, `attributes.noiseLevel`). 'something_different' does not check the `vibes` array at all — it instead scores directly off `attributes.novelty`. See 'Ranking logic' below.",
      },
      neighborhood: {
        type: "Neighborhood",
        possibleValues: [
          "rittenhouse",
          "center_city",
          "old_city",
          "fishtown",
          "university_city",
          "south_philly",
        ],
        mapsTo:
          "HARD FILTER against each venue's `neighborhood` field — exact string equality only, no fuzzy matching or aliasing. A venue outside the selected neighborhood is excluded entirely unless the user explicitly opts into 'Include nearby neighborhoods', which removes this filter completely for that search (it does not substitute a different, wider geographic definition — see 'Neighborhood aliasing' below).",
      },
      budget: {
        type: "PriceLevel (1 | 2 | 3 | 4)",
        possibleValues: [1, 2, 3, 4],
        labels: { "1": "$", "2": "$$", "3": "$$$", "4": "$$$$" },
        mapsTo:
          "HARD FILTER, treated as a CEILING against each venue's `priceLevel` — `venue.priceLevel <= budget`. A cheaper venue than requested is always fine; a more expensive one is excluded unless the user opts into 'Allow a higher budget', which removes this filter for that search.",
      },
    },
    optional: {
      food: {
        type: "FoodDrinkActivity | undefined",
        possibleValues: ["food", "drinks", "activity"],
        mapsTo:
          "HARD FILTER (only applied when the user selects it) against each venue's `foodDrinkActivity: FoodDrinkActivity[]` array — the venue must include the selected value. Note: coffee shops/cafes are tagged 'food', not 'drinks' — 'drinks' is reserved for venues with a real bar (this was a deliberate fix; see project history). Can be relaxed via 'Drop the food filter'.",
      },
      indoorOutdoor: {
        type: "IndoorOutdoorPreference | undefined",
        possibleValues: ["indoor", "outdoor"],
        mapsTo:
          "HARD FILTER (only applied when the user selects it). 'indoor' passes if `venue.hasIndoorSeating` is true (true for virtually every venue in the dataset). 'outdoor' passes ONLY if `venue.outdoorSeating === \"yes\"` — the tri-state 'unknown' does NOT count as satisfying an outdoor request, by design (an unverified fact is never treated as a match). Can be relaxed via 'Include indoor/outdoor spots too'.",
      },
    },
    notImplementedAsAFilterYet: {
      servesAlcohol: {
        type: "boolean",
        note:
          "Tracked on every venue (`servesAlcohol`) so an alcohol/no-alcohol filter could be added later, but there is currently NO UI control for it and it is not enforced anywhere in `isEligible`. Listed here because the request asked for 'any relevant feature tags including cocktails' — this is the closest stored field, but it is not a live filter input today.",
      },
    },
  },

  rankingAndFallbackLogic: {
    overview:
      "Two separate stages, kept deliberately separate: (1) ELIGIBILITY — hard filters that a venue either passes or is excluded entirely, never scored around; (2) RANKING — soft scoring that only orders venues that already passed stage 1. A venue can never claw its way into the results by scoring well if it fails a hard filter.",

    eligibility_hardFilters: {
      function: "isEligible() in src/lib/recommend.ts",
      rules: [
        "neighborhood: exact match to venue.neighborhood (or ignored entirely if the user has opted into the 'expand.neighborhood' relaxation)",
        "budget: venue.priceLevel <= budget, a ceiling not an exact match (or ignored if 'expand.budget' is active)",
        "indoorOutdoor (only if selected): 'indoor' requires venue.hasIndoorSeating === true; 'outdoor' requires venue.outdoorSeating === \"yes\" exactly — \"unknown\" fails (or ignored if 'expand.indoorOutdoor' is active)",
        "food (only if selected): venue.foodDrinkActivity must include the selected value (or ignored if 'expand.food' is active)",
      ],
      expansion:
        "ExpansionState { neighborhood, budget, indoorOutdoor, food } — all four default to false ('no expansion'). Each is toggled true ONLY by an explicit user click on a results-page 'expand' button (e.g. 'Include nearby neighborhoods'); the engine never expands automatically. The UI only offers an expansion button for a dimension if relaxing it would actually surface more eligible venues (`canExpand()` checks this before showing the button).",
    },

    ranking_softScoring: {
      function: "rankVenue() = scoreDateType() + scoreVibe() + scoreSecondaryAttributes()",
      weights: { dateTypeMatch: 4, vibeMatch: 3 },
      scoreDateType: {
        rule: "venue.dateTypes.includes(prefs.dateType) ? 4 : 0",
        exception:
          "dateType === 'surprise_me': flat 2 points (half credit) for every eligible venue regardless of its dateTypes array — there is no dateTypes tag that could satisfy 'surprise_me' specifically.",
      },
      scoreVibe: {
        rule: "venue.vibes.includes(prefs.vibe) ? 3 : 0",
        exception:
          "vibe === 'something_different': (venue.attributes.novelty / 5) * 3 — scored directly off the 1-5 novelty attribute instead of checking the vibes array, scaled onto the same 0-3 range as a normal exact-match bonus so a highly novel venue can't outscore every other vibe's exact matches.",
      },
      scoreSecondaryAttributes: {
        description:
          "Small continuous bonuses (not threshold/boolean) layered on top, keyed off prefs.dateType and prefs.vibe independently (both switch statements run; their bonuses add together). All formulas are in src/lib/recommend.ts scoreSecondaryAttributes(). Neutral midpoint for every 1-5 attribute is 3, so e.g. (attributes.memorable - 3) * 1 ranges from -2 to +2.",
        byDateType: {
          first_date: "+2 if attributes.goodForFirstMeeting; + (conversationFriendly - 3) * 0.5",
          anniversary_or_special_occasion: "+ (memorable - 3) * 1; + (romantic - 3) * 0.75",
          reconnecting: "+ (conversationFriendly - 3) * 0.75; +1 if attributes.easyToExtend",
          casual: "+1 if attributes.formality === 'casual'; +1 if attributes.easyToExtend",
          surprise_me: "+ (novelty - 3) * 0.5",
        },
        byVibe: {
          romantic:
            "+ (romantic - 3) * 1.25; +0.5 if lighting !== 'bright'; +0.5 if noiseLevel === 'quiet', -0.5 if noiseLevel === 'lively'",
          cozy_intimate:
            "+ (romantic - 3) * 0.4; +1 if lighting !== 'bright'; +1 if noiseLevel === 'quiet', -1 if noiseLevel === 'lively'",
          lively_social_or_trendy: "+ (energy - 3) * 0.75",
          fun_playful_or_something_different: "+2 if attributes.builtInActivity",
          relaxed_casual: "+ (3 - energy) * 0.5",
        },
      },
      note_notScoredHere:
        "Neighborhood, budget, indoorOutdoor, and food are NEVER part of the ranking score — every venue reaching rankVenue() already satisfies them equally (they were hard-filtered in stage 1), so there is nothing left to differentiate on that basis.",
    },

    diversityAndSelection: {
      function: "diversify() in src/lib/recommend.ts",
      description:
        "After all eligible venues are scored and sorted, the top `count` (default 3) results are chosen GREEDILY: at each step, pick whichever remaining venue has the highest (score - penalty), where penalty grows with how many already-picked results share its 'bucket' or exact category. This is not a hard cap (e.g. not 'max 1 cocktail bar') — three genuinely excellent cocktail bars can still all appear together if nothing else scores close, but a near-tie will resolve toward variety.",
      buckets: {
        drinks: ["cocktail_bar", "wine_bar", "brewery", "rooftop_bar"],
        food: ["restaurant"],
        coffee_or_dessert: ["cafe", "dessert"],
        activity: ["activity"],
      },
      penalties: {
        sameBucket: 2.5,
        sameCategory: 1.5,
        note:
          "Both penalties apply and stack (a second venue in the same exact category takes both the bucket penalty AND the category penalty). For scale: dateTypeMatch + vibeMatch alone is worth 7 points, so these penalties can flip a close call but cannot overturn a venue that's a clearly better fit.",
      },
    },

    fallbackAndRegeneration: {
      "getRecommendations()":
        "Main entry point. Computes exactMatchCount (pool size with ZERO expansion, for the results-page banner), then the actual working pool with whatever expansion is currently active, scores + diversifies it into `count` results.",
      regenerate_showMeDifferentSpots:
        "Re-calls getRecommendations() with the currently-displayed venues added to excludeIds. If fewer than `count` venues remain after exclusion, the exclusion list is DROPPED and the full eligible pool is reused (the rotation restarts) rather than ever returning fewer than 3 or pulling in a venue outside the hard filters.",
      notForMe_singleReplacement:
        "getReplacementVenue() finds the single best-scoring eligible venue not already excluded/shown. Deliberately does NOT wrap around/reuse previously-dismissed venues the way regenerate does — if nothing eligible is left, it returns null and the UI simply shows one fewer card instead of a duplicate.",
      emptyOrThinResults:
        "If exactMatchCount is below `count` and no expansion is active, the UI shows an honest 'Only N spots match' banner (or 'No exact matches' at 0) with explicit expansion buttons — the engine never pads out to 3 by silently loosening a filter or picking a worse match.",
    },

    randomization: {
      used: false,
      note:
        "No Math.random() or any other randomization exists anywhere in the recommendation engine. Every step — eligibility, scoring, tie-breaking (Array.sort is stable; ties fall back to original array order), and diversification — is fully deterministic. The same (preferences, excludeIds) input always produces the same output.",
    },

    storedPopularityOrRankingFields: {
      existsOnVenueRecords: false,
      note:
        "No venue in src/data/venues.ts carries any stored popularity, rating, or ranking field. The only per-request numeric signal is `ScoredVenue.score`, computed fresh by rankVenue() at request time and never persisted back to the data file.",
    },
  },

  neighborhoodAliasesAndGeographicGrouping: {
    aliasingInCode: {
      exists: false,
      note:
        "There is no alias table, fuzzy-matching, or geographic-grouping logic anywhere in the codebase. `neighborhood` is a plain 6-value enum (Neighborhood type in src/lib/types.ts) and eligibility uses exact string equality only (`venue.neighborhood === prefs.neighborhood`). The only way to see venues from outside the selected neighborhood is the user explicitly clicking 'Include nearby neighborhoods', which removes the neighborhood filter for that search entirely rather than substituting a specific alternate neighborhood set.",
    },
    theSixNeighborhoods: [
      "rittenhouse",
      "center_city",
      "old_city",
      "fishtown",
      "university_city",
      "south_philly",
    ],
    manualBoundaryJudgmentCalls:
      "Several individual venues sit at a genuine geographic edge between two neighborhoods (e.g. a venue a block from the Rittenhouse/Center City line, or on Christian St at the South Philly/Bella Vista line). These are NOT resolved by any code-level rule — each was manually assigned to one neighborhood value based on how the business/local guides commonly categorize it, and the specific reasoning is recorded in that venue's own `verificationNotes` field in the export above (search for the word 'border' or 'boundary').",
  },
};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

console.log(`Wrote ${outPath}`);
console.log(`Total places: ${VENUES.length}`);
console.log("By neighborhood:", countByNeighborhood);
if (unexpectedNeighborhoods.length) {
  console.log("WARNING - unexpected neighborhood values found:", unexpectedNeighborhoods);
}
