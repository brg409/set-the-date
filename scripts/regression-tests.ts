/**
 * Regression tests for the recommendation engine's hard-filter and
 * copy-accuracy guarantees. No test framework is wired up yet, so this is a
 * plain assertion script: each `check` either passes or prints a failure
 * and the script exits non-zero. Run with: npm run test:regression
 */
import { VENUES, getVenueById } from "../src/data/venues";
import { getRecommendations, getReplacementVenue } from "../src/lib/recommend";
import type { DatePreferences, ExpansionState } from "../src/lib/types";

const NO_EXPANSION: ExpansionState = {
  neighborhood: false,
  budget: false,
  indoorOutdoor: false,
  food: false,
};

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

// ── 1. Outdoor filter is a real hard filter ────────────────────────────

section("Outdoor filter: eligibility");

const outdoorPrefs: DatePreferences = {
  dateType: "first_date",
  vibe: "cozy_intimate",
  neighborhood: "rittenhouse",
  budget: 4, // widen budget so we're only testing the outdoor filter, not budget
  filters: { indoorOutdoor: "outdoor" },
};

for (let i = 0; i < 8; i++) {
  // Run several times with growing exclude lists to hit different venues,
  // including regeneration and the wraparound path.
  const excludeIds = VENUES.slice(0, i * 5).map((v) => v.id);
  const rec = getRecommendations(outdoorPrefs, { count: 3, excludeIds });
  for (const r of rec.results) {
    check(
      `outdoor result "${r.venue.name}" has outdoorSeating: "yes" (round ${i})`,
      r.venue.outdoorSeating === "yes",
      `got "${r.venue.outdoorSeating}"`
    );
  }
}

const oneTipplingPlace = getVenueById("one-tippling-place")!;
check(
  '1 Tippling Place is recorded as outdoorSeating !== "yes"',
  oneTipplingPlace.outdoorSeating !== "yes",
  `got "${oneTipplingPlace.outdoorSeating}" — if this was verified since, this test should now check for the new value`
);

const outdoorResultIds = getRecommendations(outdoorPrefs, { count: 3 }).results.map((r) => r.venue.id);
check(
  "1 Tippling Place does not appear in an outdoor-filtered result set",
  !outdoorResultIds.includes("one-tippling-place")
);

// "Not for me" replacement must also respect the outdoor filter.
const initialOutdoor = getRecommendations(outdoorPrefs, { count: 3 });
const dismissed = initialOutdoor.results[0].venue.id;
const kept = initialOutdoor.results.slice(1).map((r) => r.venue.id);
const replacement = getReplacementVenue(outdoorPrefs, NO_EXPANSION, [dismissed, ...kept]);
check(
  "'Not for me' replacement for an outdoor search also has outdoorSeating: yes",
  replacement === null || replacement.venue.outdoorSeating === "yes",
  replacement ? `got "${replacement.venue.outdoorSeating}"` : undefined
);

// Explicitly expanding the indoor/outdoor filter should be the ONLY way an
// unverified/no venue can appear.
const expandedOutdoor = getRecommendations(outdoorPrefs, {
  count: 3,
  expand: { indoorOutdoor: true },
});
check(
  "expanding indoorOutdoor can surface non-outdoor-verified venues",
  expandedOutdoor.results.some((r) => r.venue.outdoorSeating !== "yes") ||
    expandedOutdoor.results.length === 0,
  "(informational: only fails if the pool has nothing else to offer)"
);

// ── 2. Neighborhood + budget are still hard constraints ────────────────

section("Neighborhood and budget: hard constraints across full matrix");

const DATE_TYPES = ["first_date", "casual", "anniversary", "special_occasion", "reconnecting", "surprise_me"] as const;
const VIBES = ["cozy_intimate", "relaxed_casual", "lively_social", "romantic", "fun_playful", "trendy", "something_different"] as const;
const BUDGETS = [1, 2, 3, 4] as const;

let neighborhoodViolations = 0;
let budgetViolations = 0;
let indoorOutdoorViolations = 0;
let foodViolations = 0;

for (const dateType of DATE_TYPES) {
  for (const vibe of VIBES) {
    for (const budget of BUDGETS) {
      const prefs: DatePreferences = { dateType, vibe, neighborhood: "rittenhouse", budget };
      const rec = getRecommendations(prefs, { count: 3 });
      for (const r of rec.results) {
        if (r.venue.neighborhood !== "rittenhouse") neighborhoodViolations++;
        if (r.venue.priceLevel > budget) budgetViolations++;
      }
    }
  }
}
check(`no neighborhood violations across ${DATE_TYPES.length * VIBES.length * BUDGETS.length} combinations`, neighborhoodViolations === 0, `${neighborhoodViolations} found`);
check(`no budget violations across ${DATE_TYPES.length * VIBES.length * BUDGETS.length} combinations`, budgetViolations === 0, `${budgetViolations} found`);

// Same matrix again, but with the food and indoor filters both active, to
// prove regeneration + replacement respect them under real conditions.
for (const dateType of DATE_TYPES) {
  for (const budget of BUDGETS) {
    const prefs: DatePreferences = {
      dateType,
      vibe: "relaxed_casual",
      neighborhood: "rittenhouse",
      budget,
      filters: { food: "drinks", indoorOutdoor: "indoor" },
    };
    const initial = getRecommendations(prefs, { count: 3 });
    const shownIds = initial.results.map((r) => r.venue.id);
    const regenerated = getRecommendations(prefs, { count: 3, excludeIds: shownIds });
    for (const r of [...initial.results, ...regenerated.results]) {
      if (!r.venue.foodDrinkActivity.includes("drinks")) foodViolations++;
      if (!r.venue.hasIndoorSeating) indoorOutdoorViolations++;
    }
  }
}
check("regeneration honors the food filter across all date types/budgets", foodViolations === 0, `${foodViolations} violations`);
check("regeneration honors the indoor filter across all date types/budgets", indoorOutdoorViolations === 0, `${indoorOutdoorViolations} violations`);

// ── 3. Romantic searches favor genuinely romantic venues ───────────────

section("Romantic vibe: quality of matches");

const romanticPrefs: DatePreferences = {
  dateType: "anniversary",
  vibe: "romantic",
  neighborhood: "rittenhouse",
  budget: 4,
};
const romanticResults = getRecommendations(romanticPrefs, { count: 3 }).results;
check(
  "top romantic result has attributes.romantic >= 4",
  romanticResults[0].venue.attributes.romantic >= 4,
  `top result was "${romanticResults[0].venue.name}" with romantic=${romanticResults[0].venue.attributes.romantic}`
);
check(
  "all 3 romantic results have attributes.romantic >= 3 (at least neutral-or-above)",
  romanticResults.every((r) => r.venue.attributes.romantic >= 3),
  romanticResults.map((r) => `${r.venue.name}=${r.venue.attributes.romantic}`).join(", ")
);
check(
  "The Bakeshop on Twentieth does not appear in top-3 romantic results",
  !romanticResults.some((r) => r.venue.id === "bakeshop-on-twentieth")
);

// Broader sweep: for every neighborhood, a romantic+anniversary search's top
// pick should never be a cafe or dessert-category venue (weak romantic
// signal by construction — see the tagging guidelines in src/lib/types.ts).
section("Anniversary/special_occasion: never defaults to quick-service venues");

const quickServiceTopPicks: string[] = [];
for (const neighborhood of ["rittenhouse", "center_city", "old_city", "fishtown", "university_city", "south_philly"] as const) {
  for (const dateType of ["anniversary", "special_occasion"] as const) {
    const prefs: DatePreferences = { dateType, vibe: "romantic", neighborhood, budget: 4 };
    const results = getRecommendations(prefs, { count: 3 }).results;
    const top = results[0];
    if (top && (top.venue.category === "cafe" || top.venue.category === "dessert")) {
      quickServiceTopPicks.push(`${neighborhood}/${dateType} -> ${top.venue.name}`);
    }
  }
}
check(
  "no anniversary/special_occasion search's #1 result is a cafe or dessert venue",
  quickServiceTopPicks.length === 0,
  quickServiceTopPicks.join("; ")
);

// Fishtown-specific: loud, general-admission live-music/club venues and a
// German biergarten must never win a cozy/intimate/romantic/conversation
// search, since their romantic and conversationFriendly attributes were
// deliberately scored low. This is exactly the failure mode flagged when
// building this neighborhood — a wrong secondary-attribute mapping could
// let a loud venue's other strengths (novelty, memorable) outrank a
// genuinely quiet one.
section("Fishtown: loud venues never win a cozy/romantic search");

const LOUD_FISHTOWN_IDS = ["kung-fu-necktie", "the-fillmore-philadelphia", "frankford-hall"];
const cozyRomanticLeaks: string[] = [];
for (const vibe of ["cozy_intimate", "romantic"] as const) {
  for (const dateType of ["first_date", "anniversary", "special_occasion", "reconnecting"] as const) {
    const prefs: DatePreferences = { dateType, vibe, neighborhood: "fishtown", budget: 4 };
    const results = getRecommendations(prefs, { count: 3 }).results;
    for (const r of results) {
      if (LOUD_FISHTOWN_IDS.includes(r.venue.id)) {
        cozyRomanticLeaks.push(`${dateType}/${vibe} -> ${r.venue.name}`);
      }
    }
  }
}
check(
  "no loud live-music venue or biergarten appears in any Fishtown cozy_intimate/romantic search",
  cozyRomanticLeaks.length === 0,
  cozyRomanticLeaks.join("; ")
);

// Center City-specific: the same failure mode, for its big-spectacle
// theater/concert venues (grand halls you watch a show in, not intimate
// rooms you can talk in during the performance).
section("Center City: big spectacle venues never win a cozy/romantic search");

const BIG_SPECTACLE_CENTER_CITY_IDS = ["academy-of-music", "walnut-street-theatre"];
const centerCityLeaks: string[] = [];
for (const vibe of ["cozy_intimate", "romantic"] as const) {
  for (const dateType of ["first_date", "anniversary", "special_occasion", "reconnecting"] as const) {
    const prefs: DatePreferences = { dateType, vibe, neighborhood: "center_city", budget: 4 };
    const results = getRecommendations(prefs, { count: 3 }).results;
    for (const r of results) {
      if (BIG_SPECTACLE_CENTER_CITY_IDS.includes(r.venue.id)) {
        centerCityLeaks.push(`${dateType}/${vibe} -> ${r.venue.name}`);
      }
    }
  }
}
check(
  "no big-spectacle theater/concert hall appears in any Center City cozy_intimate/romantic search",
  centerCityLeaks.length === 0,
  centerCityLeaks.join("; ")
);

// South Philly-specific: the same failure mode, for venues explicitly
// documented in review sources as loud/high-energy and deliberately left
// untagged for romantic/cozy_intimate.
section("South Philly: loud venues never win a cozy/romantic search");

const LOUD_SOUTH_PHILLY_IDS = ["barcelona-wine-bar-south-philly", "stateside", "pistolas-del-sur"];
const southPhillyLeaks: string[] = [];
for (const vibe of ["cozy_intimate", "romantic"] as const) {
  for (const dateType of ["first_date", "anniversary", "special_occasion", "reconnecting"] as const) {
    const prefs: DatePreferences = { dateType, vibe, neighborhood: "south_philly", budget: 4 };
    const results = getRecommendations(prefs, { count: 3 }).results;
    for (const r of results) {
      if (LOUD_SOUTH_PHILLY_IDS.includes(r.venue.id)) {
        southPhillyLeaks.push(`${dateType}/${vibe} -> ${r.venue.name}`);
      }
    }
  }
}
check(
  "no loud bar/restaurant appears in any South Philly cozy_intimate/romantic search",
  southPhillyLeaks.length === 0,
  southPhillyLeaks.join("; ")
);

// ── 4. Fewer-than-3 results is handled honestly (no padding) ───────────

section("Fewer-than-3-results handling");

const scarcePrefs: DatePreferences = {
  dateType: "casual",
  vibe: "fun_playful",
  neighborhood: "center_city",
  budget: 1,
};
const scarce = getRecommendations(scarcePrefs, { count: 3 });
check(
  "results.length never exceeds exactMatchCount when not expanded",
  scarce.results.length <= Math.max(scarce.exactMatchCount, 0) ||
    scarce.expanded.neighborhood ||
    scarce.expanded.budget,
  `exactMatchCount=${scarce.exactMatchCount}, results=${scarce.results.length}`
);
check(
  "no result silently violates budget when exactMatchCount is low and not expanded",
  scarce.results.every((r) => r.venue.priceLevel <= scarcePrefs.budget)
);

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failures} failed.`);
if (failures > 0) {
  process.exit(1);
}
