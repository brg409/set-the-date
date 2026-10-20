/**
 * Tests for the "What are you in the mood for?" filter: the reviewed
 * classification, the budget rules for each mood, and the promise that
 * "Anything" behaves exactly as before.
 *
 * Run with: npm run test:outing
 */

import { VENUES, getVenueById } from "../src/data/venues";
import { ANYTHING_ONLY, OUTING_CLASSIFICATION } from "../src/data/outingTypes";
import { getRecommendations } from "../src/lib/recommend";
import { getOutingTypes, outingFromLegacyFood, OUTING_TYPES, venueHasOutingType } from "../src/lib/outing";
import { budgetAllows, budgetCaption, budgetRangeText, DRINKS_TOP_LEVEL, levelsShown } from "../src/lib/budget";
import { paramsToPreferences, preferencesToParams } from "../src/lib/queryParams";
import { criteriaFromParams } from "../src/lib/criteria";
import { NO_EXPANSION, nextSet } from "../src/lib/resultSession";
import type { DatePreferences, DateType, Neighborhood, OutingType, PriceLevel, Venue, Vibe } from "../src/lib/types";

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

const HOODS: Neighborhood[] = ["rittenhouse", "center_city", "old_city", "fishtown", "university_city", "south_philly"];
const BUDGETS: PriceLevel[] = [1, 2, 3, 4];
const SCENARIOS: { dateType: DateType; vibe: Vibe }[] = [
  { dateType: "first_date", vibe: "cozy_intimate" },
  { dateType: "anniversary", vibe: "romantic" },
  { dateType: "casual", vibe: "lively_social" },
  { dateType: "special_occasion", vibe: "trendy" },
  { dateType: "reconnecting", vibe: "relaxed_casual" },
  { dateType: "surprise_me", vibe: "fun_playful" },
];

const poolFor = (outing: OutingType, hood: Neighborhood, budget: PriceLevel): Venue[] =>
  VENUES.filter((v) => v.neighborhood === hood && venueHasOutingType(v.id, outing) && budgetAllows(v.priceLevel, budget, outing));

console.log("\nClassification");
const ids = new Set(VENUES.map((v) => v.id));
check("every classified id is a real venue", Object.keys(OUTING_CLASSIFICATION).every((id) => ids.has(id)));
check("every anything-only id is a real venue", ANYTHING_ONLY.every((id) => ids.has(id)));
check(
  "every venue is classified or deliberately anything-only, never both",
  VENUES.every((v) => (getOutingTypes(v.id).length > 0) !== ANYTHING_ONLY.includes(v.id))
);
check(
  "the three approved venues are the only anything-only ones",
  ANYTHING_ONLY.slice().sort().join() === ["dizengoff", "kfar", "sabrinas-cafe-university-city"].sort().join()
);
const countOf = (t: OutingType) => VENUES.filter((v) => venueHasOutingType(v.id, t)).length;
check(
  "approved counts: Dinner 83, Drinks 65, Coffee 19, Dessert 19, Activity 31",
  countOf("dinner") === 83 && countOf("drinks") === 65 && countOf("coffee") === 19 && countOf("dessert") === 19 && countOf("activity") === 31,
  OUTING_TYPES.map((t) => `${t} ${countOf(t)}`).join(", ")
);
check("32 venues fit more than one type", VENUES.filter((v) => getOutingTypes(v.id).length > 1).length === 32);
check(
  "every classification carries a reason that says whether data or a review decided it",
  Object.values(OUTING_CLASSIFICATION).every((e) => Object.values(e).every((why) => /^(data|reviewed): .{6,}/.test(why as string)))
);
const dinnerCats = VENUES.filter((v) => venueHasOutingType(v.id, "dinner")).map((v) => v.category);
check("Dinner never includes a café or dessert shop", dinnerCats.every((c) => c !== "cafe" && c !== "dessert"));
const drinksCats = VENUES.filter((v) => venueHasOutingType(v.id, "drinks")).map((v) => v.category);
check("Drinks never includes a café or dessert shop", drinksCats.every((c) => c !== "cafe" && c !== "dessert"));
check("every Drinks venue serves alcohol", VENUES.filter((v) => venueHasOutingType(v.id, "drinks")).every((v) => v.servesAlcohol));

console.log("\nAnything is unchanged");
// Every venue can be found with no mood selected, in its own neighborhood and budget.
const unreachable: string[] = [];
for (const v of VENUES) {
  const prefs: DatePreferences = { dateType: "surprise_me", vibe: "relaxed_casual", neighborhood: v.neighborhood, budget: v.priceLevel };
  // Walk "Show Me 3 More" the way the results page does, until nothing new appears.
  const seen: string[] = getRecommendations(prefs).results.map((x) => x.venue.id);
  let found = seen.includes(v.id);
  for (let i = 0; i < 40 && !found; i++) {
    const ids = nextSet(prefs, NO_EXPANSION, seen);
    if (ids.length === 0 || ids.every((id) => seen.includes(id))) break;
    if (ids.includes(v.id)) found = true;
    seen.push(...ids);
  }
  if (!found) unreachable.push(v.name);
}
check("all 188 venues can be found with Anything selected", unreachable.length === 0, unreachable.join("; "));
check(
  "an Anything search writes no mood into its link and reads back with none",
  (() => {
    const p: DatePreferences = { dateType: "casual", vibe: "trendy", neighborhood: "fishtown", budget: 2 };
    const params = preferencesToParams(p);
    return !params.has("mood") && !params.has("food") && paramsToPreferences(params)?.filters === undefined;
  })()
);
check(
  "Anything keeps the existing budget band (a $$$ search shows $$ and $$$ only)",
  levelsShown(3).join() === "2,3" && levelsShown(4).join() === "3,4" && levelsShown(1).join() === "1" && levelsShown(2).join() === "1,2"
);

console.log("\nLinks and old links");
const withMood = preferencesToParams({ dateType: "casual", vibe: "trendy", neighborhood: "fishtown", budget: 2, filters: { outing: "dessert" } });
check("a mood is written as mood=… and read back", withMood.get("mood") === "dessert" && paramsToPreferences(withMood)?.filters?.outing === "dessert");
check("the Find page pre-fills the mood from a link", criteriaFromParams(withMood).outing === "dessert");
check(
  "old food links map to the matching mood",
  outingFromLegacyFood("food") === "dinner" && outingFromLegacyFood("drinks") === "drinks" && outingFromLegacyFood("activity") === "activity" && outingFromLegacyFood("x") === undefined
);
check(
  "an old saved search with food=drinks now searches the Drinks mood",
  paramsToPreferences(new URLSearchParams("dateType=casual&vibe=trendy&neighborhood=fishtown&budget=2&food=drinks"))?.filters?.outing === "drinks"
);
check("a made-up mood is ignored", criteriaFromParams(new URLSearchParams("mood=spaceship")).outing === undefined);

console.log("\nBudget rules");
check("Coffee and Dessert are a pure ceiling (any budget shows them)", [1, 2, 3, 4].every((b) => budgetAllows(1, b, "coffee") && budgetAllows(1, b, "dessert")));
check("a Coffee search never shows a place pricier than the budget", !budgetAllows(3, 2, "coffee") && budgetAllows(2, 2, "coffee"));
check("Drinks $$$$ behaves as the top level that exists", DRINKS_TOP_LEVEL === 3 && levelsShown(4, "drinks").join() === levelsShown(3, "drinks").join());
check("Drinks at $ still shows only $", levelsShown(1, "drinks").join() === "1");
check("Dinner and Activity keep the default band", levelsShown(4, "dinner").join() === "3,4" && levelsShown(3, "activity").join() === "2,3");
check("the budget caption says a higher budget is a ceiling, not a target", /ceiling, not a target/.test(budgetCaption(3)) && /don't have to spend/.test(budgetCaption(undefined)));
check("Coffee and Dessert captions say they show at any budget", /any budget/.test(budgetCaption(3, "coffee")) && /any budget/.test(budgetCaption(4, "dessert")));
check("the Drinks $$$$ caption explains there's nothing pricier", /priciest bars are \$\$\$/.test(budgetCaption(4, "drinks")));
check("the Coffee caption is honest about how many are under $25", /almost all|all under/.test(budgetCaption(2, "coffee")));
check("the budget wording matches the levels shown", budgetRangeText(3) === "about $25 to $90 per person" && budgetRangeText(2, "dessert") === "any budget");

console.log("\nEvery mood x neighborhood x budget x occasion/vibe");
let combos = 0;
const problems: string[] = [];
const thin: Record<string, string[]> = {};
for (const outing of OUTING_TYPES) {
  for (const hood of HOODS) {
    for (const budget of BUDGETS) {
      const pool = poolFor(outing, hood, budget);
      if (pool.length < 3) (thin[outing] ||= []).push(`${hood.slice(0, 4)} ${"$".repeat(budget)}=${pool.length}`);
      for (const sc of SCENARIOS) {
        combos++;
        const prefs: DatePreferences = { ...sc, neighborhood: hood, budget, filters: { outing } };
        const r = getRecommendations(prefs);
        const tag = `${outing}/${hood}/${"$".repeat(budget)}/${sc.dateType}-${sc.vibe}`;
        const got = r.results.map((x) => x.venue);
        if (got.length !== Math.min(3, pool.length)) problems.push(`${tag}: ${got.length} results for a pool of ${pool.length}`);
        if (new Set(got.map((g) => g.id)).size !== got.length) problems.push(`${tag}: duplicate result`);
        for (const g of got) {
          if (g.neighborhood !== hood) problems.push(`${tag}: ${g.name} is outside the neighborhood`);
          if (!venueHasOutingType(g.id, outing)) problems.push(`${tag}: ${g.name} is not classified ${outing}`);
          if (!budgetAllows(g.priceLevel, budget, outing)) problems.push(`${tag}: ${g.name} breaks the budget rule`);
        }
        if (r.exactMatchCount !== pool.length) problems.push(`${tag}: reported ${r.exactMatchCount} matches, expected ${pool.length}`);
      }
    }
  }
}
check(`${combos} searches: every result is in the neighborhood, the budget rule and the mood`, problems.length === 0, problems.slice(0, 3).join(" | "));
check("a thin pool returns only the valid matches (never filler up to three)", problems.filter((p) => /results for a pool/.test(p)).length === 0);

console.log("\nBroadening");
const sparse: DatePreferences = { dateType: "casual", vibe: "relaxed_casual", neighborhood: "fishtown", budget: 1, filters: { outing: "dinner" } };
const sparseBase = getRecommendations(sparse);
check("a sparse Dinner search (Fishtown, $) returns only its real matches", sparseBase.results.length === sparseBase.exactMatchCount && sparseBase.exactMatchCount < 3);
check("it offers to broaden the mood", sparseBase.canExpandOuting);
const broadened = getRecommendations(sparse, { expand: { neighborhood: false, budget: false, indoorOutdoor: false, food: false, outing: true } });
check("broadening adds other kinds of places, each marked as outside the original filter", broadened.results.length > sparseBase.results.length && broadened.results.filter((r) => r.isExpandedMatch).length === broadened.results.length - sparseBase.results.length);
check(
  "broadening the mood is only offered when it would add places",
  OUTING_TYPES.every((o) => {
    const p: DatePreferences = { dateType: "casual", vibe: "relaxed_casual", neighborhood: "rittenhouse", budget: 2, filters: { outing: o } };
    const r = getRecommendations(p);
    const wide = getRecommendations(p, { expand: { neighborhood: false, budget: false, indoorOutdoor: false, food: false, outing: true } });
    return r.canExpandOuting === (wide.exactMatchCount !== r.exactMatchCount || VENUES.some((v) => v.neighborhood === "rittenhouse" && budgetAllows(v.priceLevel, 2) && !venueHasOutingType(v.id, o)));
  })
);

console.log("\nShow Me 3 More stays inside the mood");
let leaks = 0;
for (const outing of OUTING_TYPES) {
  const prefs: DatePreferences = { dateType: "first_date", vibe: "cozy_intimate", neighborhood: "rittenhouse", budget: 3, filters: { outing } };
  const seen: string[] = [];
  for (let i = 0; i < 8; i++) {
    const r = getRecommendations(prefs, { excludeIds: seen });
    for (const x of r.results) {
      if (!venueHasOutingType(x.venue.id, outing)) leaks++;
      seen.push(x.venue.id);
    }
  }
}
check("later sets never include a place outside the mood", leaks === 0, `${leaks} leaked`);

console.log("\nAppropriateness (Dinner, Drinks, Coffee, Dessert)");
const wrongKind: string[] = [];
for (const outing of ["dinner", "drinks", "coffee", "dessert"] as const) {
  for (const hood of HOODS) {
    for (const budget of BUDGETS) {
      const r = getRecommendations({ dateType: "casual", vibe: "relaxed_casual", neighborhood: hood, budget, filters: { outing } });
      for (const x of r.results) {
        const c = x.venue.category;
        if (outing === "dinner" && (c === "cafe" || c === "dessert" || c === "activity" && x.venue.id !== "the-victor-cafe")) wrongKind.push(`dinner: ${x.venue.name} (${c})`);
        if (outing === "drinks" && (c === "cafe" || c === "dessert" || c === "restaurant" && !getVenueById(x.venue.id)?.servesAlcohol)) wrongKind.push(`drinks: ${x.venue.name} (${c})`);
        if (outing === "coffee" && c !== "cafe" && c !== "dessert" && c !== "cocktail_bar") wrongKind.push(`coffee: ${x.venue.name} (${c})`);
        if (outing === "dessert" && c !== "dessert" && c !== "cafe") wrongKind.push(`dessert: ${x.venue.name} (${c})`);
      }
    }
  }
}
check("results are the right kind of place for the mood", wrongKind.length === 0, wrongKind.slice(0, 4).join(" | "));

console.log("\nCoverage (information)");
for (const outing of OUTING_TYPES) {
  const good = HOODS.flatMap((h) => BUDGETS.map((b) => poolFor(outing, h, b).length)).filter((n) => n >= 3).length;
  console.log(`  ${outing.padEnd(9)} ${countOf(outing)} venues; ${good}/24 neighborhood x budget searches return 3+  thin: ${(thin[outing] ?? []).join(" ")}`);
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);
