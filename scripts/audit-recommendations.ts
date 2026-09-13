/**
 * Recommendation-quality audit for the Rittenhouse dataset.
 *
 * Runs every (dateType × vibe × budget) combination for Rittenhouse through
 * the real recommendation engine and reports coverage, variety, and
 * concentration stats. Run with: npm run audit
 */
import { VENUES } from "../src/data/venues";
import { getRecommendations, getReplacementVenue } from "../src/lib/recommend";
import type { DatePreferences, DateType, PriceLevel, Vibe } from "../src/lib/types";

const DATE_TYPES: DateType[] = [
  "first_date",
  "casual",
  "anniversary",
  "special_occasion",
  "reconnecting",
  "surprise_me",
];
const VIBES: Vibe[] = [
  "cozy_intimate",
  "relaxed_casual",
  "lively_social",
  "romantic",
  "fun_playful",
  "trendy",
  "something_different",
];
const BUDGETS: PriceLevel[] = [1, 2, 3, 4];
const NEIGHBORHOOD = "rittenhouse" as const;

const ritt = VENUES.filter((v) => v.neighborhood === NEIGHBORHOOD);
console.log(`Rittenhouse venue count: ${ritt.length}\n`);

interface ComboResult {
  dateType: DateType;
  vibe: Vibe;
  budget: PriceLevel;
  exactMatchCount: number;
  resultNames: string[];
  resultIds: string[];
  categories: string[];
  budgetViolation: boolean;
  neighborhoodViolation: boolean;
  fewerThanThree: boolean;
  sameCategory3x: boolean;
}

const combos: ComboResult[] = [];
const appearanceCount = new Map<string, number>();
const appearanceRank1Count = new Map<string, number>();

for (const dateType of DATE_TYPES) {
  for (const vibe of VIBES) {
    for (const budget of BUDGETS) {
      const prefs: DatePreferences = { dateType, vibe, neighborhood: NEIGHBORHOOD, budget };
      const rec = getRecommendations(prefs, { count: 3 });
      const results = rec.results;

      for (const [i, r] of results.entries()) {
        appearanceCount.set(r.venue.id, (appearanceCount.get(r.venue.id) ?? 0) + 1);
        if (i === 0) appearanceRank1Count.set(r.venue.id, (appearanceRank1Count.get(r.venue.id) ?? 0) + 1);
      }

      const categories = results.map((r) => r.venue.category);
      const categoryCounts = new Map<string, number>();
      for (const c of categories) categoryCounts.set(c, (categoryCounts.get(c) ?? 0) + 1);

      combos.push({
        dateType,
        vibe,
        budget,
        exactMatchCount: rec.exactMatchCount,
        resultNames: results.map((r) => r.venue.name),
        resultIds: results.map((r) => r.venue.id),
        categories,
        budgetViolation: results.some((r) => r.venue.priceLevel > budget),
        neighborhoodViolation: results.some((r) => r.venue.neighborhood !== NEIGHBORHOOD),
        fewerThanThree: results.length < 3,
        sameCategory3x: [...categoryCounts.values()].some((n) => n === 3),
      });
    }
  }
}

console.log(`Total combinations tested: ${combos.length}\n`);

// ---- Firm-filter violations ----
const budgetViolations = combos.filter((c) => c.budgetViolation);
const neighborhoodViolations = combos.filter((c) => c.neighborhoodViolation);
console.log(`Budget violations: ${budgetViolations.length}`);
console.log(`Neighborhood violations: ${neighborhoodViolations.length}`);

// ---- Fewer than 3 results ----
const short = combos.filter((c) => c.fewerThanThree);
console.log(`\nCombinations with fewer than 3 results: ${short.length}`);
for (const c of short.slice(0, 30)) {
  console.log(
    `  ${c.dateType} / ${c.vibe} / $${c.budget} -> ${c.resultNames.length} results (exact match pool: ${c.exactMatchCount})`
  );
}

// ---- Same category 3x ----
const sameCat = combos.filter((c) => c.sameCategory3x);
console.log(`\nCombinations where all 3 results share one category: ${sameCat.length}`);
for (const c of sameCat.slice(0, 30)) {
  console.log(`  ${c.dateType} / ${c.vibe} / $${c.budget} -> ${c.resultNames.join(", ")} [${c.categories.join(", ")}]`);
}

// ---- Concentration ----
console.log(`\n--- Venue appearance frequency (top 3) across ${combos.length} combos ---`);
const sortedByAppearance = [...appearanceCount.entries()].sort((a, b) => b[1] - a[1]);
const nameById = new Map(ritt.map((v) => [v.id, v.name]));
console.log("Top 15 most frequently recommended:");
for (const [id, count] of sortedByAppearance.slice(0, 15)) {
  const rank1 = appearanceRank1Count.get(id) ?? 0;
  console.log(
    `  ${nameById.get(id)} — ${count}/${combos.length} (${((count / combos.length) * 100).toFixed(1)}%), #1 rank: ${rank1}x`
  );
}

console.log("\nVenues that NEVER appear in top 3:");
const neverAppear = ritt.filter((v) => !appearanceCount.has(v.id));
for (const v of neverAppear) {
  console.log(`  ${v.name} (${v.category}, $${v.priceLevel}, dateTypes: ${v.dateTypes.join("/")}, vibes: ${v.vibes.join("/")})`);
}
console.log(`Total never-appearing: ${neverAppear.length} / ${ritt.length}`);

// ---- Category bias check ----
console.log("\n--- Category representation across all top-3 slots ---");
const categoryTotal = new Map<string, number>();
for (const c of combos) for (const cat of c.categories) categoryTotal.set(cat, (categoryTotal.get(cat) ?? 0) + 1);
const totalSlots = combos.length * 3;
for (const [cat, count] of [...categoryTotal.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}/${totalSlots} (${((count / totalSlots) * 100).toFixed(1)}%)`);
}
const rittCategoryTotal = new Map<string, number>();
for (const v of ritt) rittCategoryTotal.set(v.category, (rittCategoryTotal.get(v.category) ?? 0) + 1);
console.log("\n--- For comparison, category share of the Rittenhouse dataset itself ---");
for (const [cat, count] of [...rittCategoryTotal.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}/${ritt.length} (${((count / ritt.length) * 100).toFixed(1)}%)`);
}

// ---- Regenerate test ----
console.log("\n--- Regenerate ('show me different spots') spot checks ---");
const regenSamples: DatePreferences[] = [
  { dateType: "first_date", vibe: "cozy_intimate", neighborhood: NEIGHBORHOOD, budget: 2 },
  { dateType: "anniversary", vibe: "romantic", neighborhood: NEIGHBORHOOD, budget: 3 },
  { dateType: "casual", vibe: "lively_social", neighborhood: NEIGHBORHOOD, budget: 2 },
];
for (const prefs of regenSamples) {
  const first = getRecommendations(prefs, { count: 3 });
  const firstIds = first.results.map((r) => r.venue.id);
  const second = getRecommendations(prefs, { count: 3, excludeIds: firstIds });
  const secondIds = second.results.map((r) => r.venue.id);
  const overlap = firstIds.filter((id) => secondIds.includes(id));
  console.log(
    `  ${prefs.dateType}/${prefs.vibe}/$${prefs.budget}: round1=[${first.results.map((r) => r.venue.name).join(", ")}] round2=[${second.results.map((r) => r.venue.name).join(", ")}] overlap=${overlap.length}`
  );
}

// ---- Not-for-me test ----
console.log("\n--- 'Not for me' replacement spot checks ---");
for (const prefs of regenSamples) {
  const initial = getRecommendations(prefs, { count: 3 });
  const dismissedId = initial.results[0].venue.id;
  const keepIds = initial.results.slice(1).map((r) => r.venue.id);
  const replacement = getReplacementVenue(
    prefs,
    { neighborhood: false, budget: false, indoorOutdoor: false, food: false },
    [dismissedId, ...keepIds]
  );
  const dupInKeep = replacement && keepIds.includes(replacement.venue.id);
  const isDismissed = replacement && replacement.venue.id === dismissedId;
  console.log(
    `  ${prefs.dateType}/${prefs.vibe}/$${prefs.budget}: dismissed=${nameById.get(dismissedId)}, replacement=${
      replacement ? replacement.venue.name : "NONE"
    }, duplicateOfKept=${dupInKeep}, isDismissedVenue=${isDismissed}`
  );
}

console.log("\nDone.");
