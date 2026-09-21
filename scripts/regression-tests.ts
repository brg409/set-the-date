/**
 * Regression tests for the recommendation engine's hard-filter and
 * copy-accuracy guarantees. No test framework is wired up yet, so this is a
 * plain assertion script: each `check` either passes or prints a failure
 * and the script exits non-zero. Run with: npm run test:regression
 */
import { VENUES, getVenueById } from "../src/data/venues";
import { getRecommendations, getReplacementVenue, rankVenue } from "../src/lib/recommend";
import type {
  DatePreferences,
  DateType,
  ExpansionState,
  Neighborhood,
  PriceLevel,
  ScoredVenue,
  Venue,
  VenueCategory,
  Vibe,
} from "../src/lib/types";

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
// unverified/no venue can appear. Checked against the full expanded POOL
// (a very large `count` returns every eligible venue, ordered) rather than
// just the top-3: which single non-verified venue (if several are tied)
// happens to win the top-3 tie-break is a legitimate, expected detail of
// Phase 2B's deterministic tie-breaking, not something this check should
// depend on — what actually matters is that the hard filter's removal
// genuinely changed which venues are eligible at all.
const expandedOutdoorPool = getRecommendations(outdoorPrefs, {
  count: 500,
  expand: { indoorOutdoor: true },
});
check(
  "expanding indoorOutdoor can surface non-outdoor-verified venues",
  expandedOutdoorPool.results.some((r) => r.venue.outdoorSeating !== "yes") ||
    expandedOutdoorPool.results.length === 0,
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

// ── 5. Brewery/bar_pub taxonomy split ───────────────────────────────────
//
// `brewery` used to include actual breweries alongside pubs, taverns, beer
// halls, sports bars, and bar/music venues that don't brew on-site — since
// diversify() varies results by category, this let e.g. a sports bar, a
// historic tavern, and an Irish pub count as "different enough" purely
// because none of them were literally called a restaurant. Locks the split
// in place so a future data edit can't silently blur it back together.

section("Brewery/bar_pub taxonomy");

const TRUE_BREWERY_IDS = [
  "iron-hill-brewery-center-city",
  "evil-genius-beer-company",
  "two-locals-brewing",
  "cartesian-brewing",
  "human-robot-sud",
];
const BAR_PUB_IDS = [
  "garage-rittenhouse",
  "monks-cafe",
  "mcgillins-olde-ale-house",
  "bru-craft-and-wurst",
  "khyber-pass-pub",
  "sassafras-bar",
  "national-mechanics",
  "plough-and-the-stars",
  "frankford-hall",
  "johnny-brendas",
  "fishtown-tavern",
  "cedar-point-bar-and-kitchen",
  "new-deck-tavern",
  "local-44",
  "fountain-porter",
  "triangle-tavern",
];

const actualBreweryIds = VENUES.filter((v) => v.category === "brewery").map((v) => v.id).sort();
const actualBarPubIds = VENUES.filter((v) => v.category === "bar_pub").map((v) => v.id).sort();

check(
  "exactly 5 venues are categorized as brewery, and they're the right 5",
  JSON.stringify(actualBreweryIds) === JSON.stringify([...TRUE_BREWERY_IDS].sort()),
  actualBreweryIds.join(", ")
);
check(
  "exactly 16 venues are categorized as bar_pub, and they're the right 16",
  JSON.stringify(actualBarPubIds) === JSON.stringify([...BAR_PUB_IDS].sort()),
  actualBarPubIds.join(", ")
);

// ── 6. Phase 2B: quality-gated exact-tie hashing ────────────────────────
//
// Before this, a tie in adjusted score fell back to source-array order —
// the same handful of venues won every tie, and 31 venues never appeared
// in an initial top-3 across the full 1,008-combo matrix. diversify() now
// breaks adjusted-score ties by preferring the higher raw (pre-diversity-
// penalty) score first, and only hashes venue ID + preferences if raw
// score is ALSO tied. This section locks in the properties that made that
// change safe to ship: fully deterministic, every hard filter untouched,
// and — the key guarantee — no selected slot is ever a lower-raw-score
// venue than what the OLD source-order tie-break would have picked.

section("Phase 2B: quality-gated exact-tie hashing");

// Determinism: the exact same preferences must always produce the exact
// same three venues, in the exact same order.
{
  const prefs: DatePreferences = { dateType: "casual", vibe: "trendy", neighborhood: "old_city", budget: 3 };
  const run1 = getRecommendations(prefs, { count: 3 }).results.map((r) => r.venue.id);
  const run2 = getRecommendations(prefs, { count: 3 }).results.map((r) => r.venue.id);
  const run3 = getRecommendations(prefs, { count: 3 }).results.map((r) => r.venue.id);
  check(
    "identical preferences always produce identical results (3 runs)",
    JSON.stringify(run1) === JSON.stringify(run2) && JSON.stringify(run2) === JSON.stringify(run3),
    `${run1.join(",")} / ${run2.join(",")} / ${run3.join(",")}`
  );
}

// The specific case Approach 4 was built to fix: a strong romantic venue
// (Superfolie) knocked down by the diversity penalty must not lose a tie
// to a genuinely unrelated, poor-fit venue (Mission Taqueria) that
// happens to coincidentally land on the same adjusted score.
{
  const prefs: DatePreferences = {
    neighborhood: "rittenhouse",
    dateType: "special_occasion",
    vibe: "romantic",
    budget: 2,
  };
  const ids = getRecommendations(prefs, { count: 3 }).results.map((r) => r.venue.id);
  check(
    "Rittenhouse special_occasion/romantic/$$ retains Superfolie, not Mission Taqueria",
    ids.includes("superfolie") && !ids.includes("mission-taqueria"),
    ids.join(", ")
  );
}

// No selected slot may ever score lower (raw, pre-penalty) than the venue
// the OLD (pre-Phase-2B) source-order tie-break would have selected for
// that same slot. The old TIE-BREAK behavior is re-derived here — not
// imported — specifically so this test keeps comparing against that
// historical baseline even as diversify() itself evolves further.
//
// Eligibility, in contrast, is intentionally NOT frozen to its pre-Phase-2B
// state: it mirrors whatever isEligible() currently does (as of the budget
// eligibility fix, the selected price level or one level cheaper, with the
// top tier kept as a pure ceiling — see isEligible's comment in
// recommend.ts). This test exists to isolate ONE variable, tie-break
// behavior, and hold everything else constant at its current, correct
// state — comparing against a stale eligibility rule would flag every
// venue a later, deliberate eligibility change correctly excludes as a
// false "regression."
{
  function oldIsEligible(venue: Venue, prefs: DatePreferences): boolean {
    if (venue.neighborhood !== prefs.neighborhood) return false;
    if (prefs.budget === 4) return venue.priceLevel <= 4;
    return venue.priceLevel <= prefs.budget && venue.priceLevel >= prefs.budget - 1;
  }
  function oldGetVenueBucket(category: VenueCategory): string {
    switch (category) {
      case "cocktail_bar":
      case "wine_bar":
      case "brewery":
      case "bar_pub":
      case "rooftop_bar":
        return "drinks";
      case "restaurant":
        return "food";
      case "cafe":
      case "dessert":
        return "coffee_or_dessert";
      case "activity":
        return "activity";
    }
  }
  const OLD_DIVERSITY_PENALTY = { sameBucket: 2.5, sameCategory: 1.5 };
  function oldDiversify(sorted: ScoredVenue[], count: number): ScoredVenue[] {
    const result: ScoredVenue[] = [];
    const bucketCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const remaining = [...sorted];
    while (result.length < count && remaining.length > 0) {
      let bestIndex = 0;
      let bestAdjustedScore = -Infinity;
      remaining.forEach((candidate, index) => {
        const bucket = oldGetVenueBucket(candidate.venue.category);
        const penalty =
          (bucketCounts.get(bucket) ?? 0) * OLD_DIVERSITY_PENALTY.sameBucket +
          (categoryCounts.get(candidate.venue.category) ?? 0) * OLD_DIVERSITY_PENALTY.sameCategory;
        const adjustedScore = candidate.score - penalty;
        if (adjustedScore > bestAdjustedScore) {
          bestAdjustedScore = adjustedScore;
          bestIndex = index;
        }
      });
      const [picked] = remaining.splice(bestIndex, 1);
      result.push(picked);
      const bucket = oldGetVenueBucket(picked.venue.category);
      bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
      categoryCounts.set(picked.venue.category, (categoryCounts.get(picked.venue.category) ?? 0) + 1);
    }
    return result;
  }
  function oldTop3(prefs: DatePreferences): ScoredVenue[] {
    const pool = VENUES.filter((v) => oldIsEligible(v, prefs));
    const scored = pool
      .map((v) => ({ venue: v, score: rankVenue(v, prefs), whyItFits: "", matchedTags: [] as string[] }))
      .sort((a, b) => b.score - a.score);
    return oldDiversify(scored, 3);
  }

  const DATE_TYPES: DateType[] = ["first_date", "casual", "anniversary", "special_occasion", "reconnecting", "surprise_me"];
  const VIBES: Vibe[] = ["cozy_intimate", "relaxed_casual", "lively_social", "romantic", "fun_playful", "trendy", "something_different"];
  const NEIGHBORHOODS: Neighborhood[] = ["rittenhouse", "center_city", "old_city", "fishtown", "university_city", "south_philly"];
  const BUDGETS: PriceLevel[] = [1, 2, 3, 4];

  let combosChecked = 0;
  let combosReordered = 0;
  let slotRegressions = 0;
  const exposure = new Map<string, number>();
  for (const v of VENUES) exposure.set(v.id, 0);

  for (const neighborhood of NEIGHBORHOODS) {
    for (const dateType of DATE_TYPES) {
      for (const vibe of VIBES) {
        for (const budget of BUDGETS) {
          combosChecked++;
          const prefs: DatePreferences = { neighborhood, dateType, vibe, budget };
          const oldPicks = oldTop3(prefs);
          const newPicks = getRecommendations(prefs, { count: 3 }).results;
          for (const r of newPicks) exposure.set(r.venue.id, (exposure.get(r.venue.id) ?? 0) + 1);
          if (JSON.stringify(oldPicks.map((p) => p.venue.id)) !== JSON.stringify(newPicks.map((p) => p.venue.id))) {
            combosReordered++;
          }
          for (let slot = 0; slot < 3; slot++) {
            if (oldPicks[slot] && newPicks[slot] && oldPicks[slot].score - newPicks[slot].score > 1e-9) {
              slotRegressions++;
            }
          }
        }
      }
    }
  }

  check(
    `no selected slot scores lower (raw) than the old tie-break's pick, across all ${combosChecked} combinations`,
    slotRegressions === 0,
    `${slotRegressions} regression(s) found`
  );

  const buriedCount = [...exposure.values()].filter((n) => n === 0).length;
  check(
    "buried venues (never in an initial top-3) fall to 16 or fewer (was 31 before Phase 2B)",
    buriedCount <= 16,
    `${buriedCount} buried venues`
  );

  console.log(`  (informational: ${combosReordered} / ${combosChecked} combinations reordered vs. the old tie-break)`);
}

// ── 7. Budget eligibility fix + exact-match bonus ───────────────────────
//
// Budget used to be a pure ceiling (any cheaper venue was fully eligible),
// which let a $ venue's fit on other axes outrank genuinely
// budget-appropriate venues — e.g. a $ bakery beating a $$ wine bar in a
// $$$ search purely because "quiet and casual" scored well, despite the
// bakery being two price levels below what was asked for. Fixed by
// narrowing eligibility to the selected level or one level cheaper (with
// the top tier, $$$$, kept as a pure ceiling — see isEligible's comment),
// plus a small scoring bonus for an exact price-level match over a
// one-level-cheaper substitute.

section("Budget eligibility fix + exact-match bonus");

// The reported case: a $ bakery must not appear at all for a $$$ search,
// and the genuinely budget-appropriate wine bar must rank first.
{
  const prefs: DatePreferences = { neighborhood: "rittenhouse", dateType: "casual", vibe: "cozy_intimate", budget: 3 };
  const ids = getRecommendations(prefs, { count: 3 }).results.map((r) => r.venue.id);
  check(
    "Rittenhouse casual/cozy_intimate/$$$ excludes The Bakeshop (two levels below budget) and leads with Superfolie",
    !ids.includes("bakeshop-on-twentieth") && ids[0] === "superfolie",
    ids.join(", ")
  );
}

// General sweep: across the full matrix, a venue two-or-more price levels
// below the selected budget must never appear in the top-3 UNLESS the
// user has explicitly expanded the budget filter (not tested here — this
// checks the default, non-expanded search only).
{
  const DATE_TYPES: DateType[] = ["first_date", "casual", "anniversary", "special_occasion", "reconnecting", "surprise_me"];
  const VIBES: Vibe[] = ["cozy_intimate", "relaxed_casual", "lively_social", "romantic", "fun_playful", "trendy", "something_different"];
  const NEIGHBORHOODS: Neighborhood[] = ["rittenhouse", "center_city", "old_city", "fishtown", "university_city", "south_philly"];
  let violations = 0;
  const violationExamples: string[] = [];
  for (const neighborhood of NEIGHBORHOODS) {
    for (const dateType of DATE_TYPES) {
      for (const vibe of VIBES) {
        for (const budget of [2, 3] as PriceLevel[]) {
          // Budget 4 is deliberately exempt (pure ceiling, see above) and
          // budget 1 has no cheaper tier to violate.
          const prefs: DatePreferences = { neighborhood, dateType, vibe, budget };
          const results = getRecommendations(prefs, { count: 3 }).results;
          for (const r of results) {
            if (budget - r.venue.priceLevel >= 2) {
              violations++;
              if (violationExamples.length < 5) {
                violationExamples.push(`${neighborhood}/${dateType}/${vibe}/$${budget} -> ${r.venue.name} ($${r.venue.priceLevel})`);
              }
            }
          }
        }
      }
    }
  }
  check(
    "no venue two-or-more price levels below budget appears in a default (non-expanded) $$ or $$$ search",
    violations === 0,
    violationExamples.join("; ")
  );
}

// The $$$$ tier is a deliberate exception: still a pure ceiling, so $ and
// $$ venues remain reachable there (this is what keeps the loud-venue
// safeguards above passing — narrowing the top tier the same way thinned
// some neighborhoods' cozy/quiet options enough to force in a loud venue).
{
  const prefs: DatePreferences = { neighborhood: "rittenhouse", dateType: "casual", vibe: "relaxed_casual", budget: 4 };
  const results = getRecommendations(prefs, { count: 3 }).results;
  check(
    "the $$$$ tier still admits venues more than one level cheaper (pure ceiling, no floor)",
    results.some((r) => r.venue.priceLevel <= 2),
    results.map((r) => `${r.venue.name}($${r.venue.priceLevel})`).join(", ")
  );
}

// Exact-match bonus: an exact price-level match must outrank an
// otherwise-identical-scoring one-level-cheaper venue.
{
  const prefs: DatePreferences = { neighborhood: "rittenhouse", dateType: "first_date", vibe: "cozy_intimate", budget: 2 };
  const jjThai = VENUES.find((v) => v.id === "jj-thai-cuisine")!;
  const vita = VENUES.find((v) => v.id === "vita-gelato")!;
  const jjThaiScore = rankVenue(jjThai, prefs);
  const vitaScore = rankVenue(vita, prefs);
  check(
    "an exact price-level match (JJ Thai, $$) outscores a same-raw-fit one-level-cheaper venue (Vita, $) by the exact-match bonus",
    jjThai.priceLevel === prefs.budget && jjThaiScore > vitaScore,
    `JJ Thai=${jjThaiScore.toFixed(2)} ($${jjThai.priceLevel}), Vita=${vitaScore.toFixed(2)} ($${vita.priceLevel})`
  );
}

// Regeneration must still exclude every currently-displayed venue.
{
  const prefs: DatePreferences = { neighborhood: "fishtown", dateType: "casual", vibe: "relaxed_casual", budget: 3 };
  const first = getRecommendations(prefs, { count: 3 });
  const shownIds = first.results.map((r) => r.venue.id);
  const regenerated = getRecommendations(prefs, { count: 3, excludeIds: shownIds });
  check(
    "regenerating still excludes every currently-displayed venue",
    regenerated.results.every((r) => !shownIds.includes(r.venue.id)) || regenerated.results.length === 0,
    regenerated.results.map((r) => r.venue.id).join(", ")
  );
}

// Dataset integrity: update these when venues are intentionally added.
check("all 188 venues remain", VENUES.length === 188, `found ${VENUES.length}`);
{
  const NEIGHBORHOOD_COUNTS: Record<string, number> = {
    rittenhouse: 54,
    center_city: 31,
    old_city: 29,
    fishtown: 26,
    university_city: 23,
    south_philly: 25,
  };
  const actualCounts: Record<string, number> = {};
  for (const v of VENUES) actualCounts[v.neighborhood] = (actualCounts[v.neighborhood] ?? 0) + 1;
  check(
    "neighborhood counts match the expected totals",
    JSON.stringify(actualCounts) === JSON.stringify(NEIGHBORHOOD_COUNTS),
    JSON.stringify(actualCounts)
  );
}

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failures} failed.`);
if (failures > 0) {
  process.exit(1);
}
