// How the Budget choice decides which venues are shown, and how the Find page
// explains it. One source of truth for the engine (recommend.ts) and the UI.
//
// Budget is per person: $ under $25, $$ $25-50, $$$ $50-90, $$$$ $90+.
//
// Default rule (Anything, Dinner, Activity): the level you pick and the one
// below it. A higher budget never means a place costs that much; it widens
// what you'll see, and cheap places drop out at the top so $$$$ shows splurges.
//
//   Coffee, Dessert: a pure ceiling. They are almost all under $25, and
//     someone choosing $$$ shouldn't lose them, so they show at any budget.
//   Drinks: the default rule, but no bar costs more than $$$, so $$$$ is
//     treated as $$$ instead of showing nothing.

import { VENUES } from "@/data/venues";
import { getOutingTypes } from "./outing";
import type { OutingType, PriceLevel } from "./types";

/** The priciest level any Drinks venue has; computed so it follows the data. */
export const DRINKS_TOP_LEVEL: number = Math.max(
  1,
  ...VENUES.filter((v) => getOutingTypes(v.id).includes("drinks")).map((v) => v.priceLevel)
);

/** The budget the rule actually applies for this kind of outing. */
export function effectiveBudget(budget: number, outing?: OutingType): number {
  return outing === "drinks" ? Math.min(budget, DRINKS_TOP_LEVEL) : budget;
}

export function budgetAllows(priceLevel: number, budget: number, outing?: OutingType): boolean {
  if (outing === "coffee" || outing === "dessert") return priceLevel <= budget;
  const b = effectiveBudget(budget, outing);
  return priceLevel <= b && priceLevel >= b - 1;
}

/**
 * True for a place cheaper than the budget's range. Only reachable after
 * someone widens the budget; the results then label it so it's clear it falls
 * outside what they asked for.
 */
export function isBelowBudget(priceLevel: number, budget: number, outing?: OutingType): boolean {
  return !budgetAllows(priceLevel, budget, outing) && priceLevel < effectiveBudget(budget, outing);
}

/** The levels a budget choice shows, e.g. $$$ -> [2, 3]. */
export function levelsShown(budget: number, outing?: OutingType): number[] {
  return ([1, 2, 3, 4] as PriceLevel[]).filter((level) => budgetAllows(level, budget, outing));
}

const RANGE_TEXT: Record<number, string> = {
  1: "under $25 per person",
  2: "up to about $50 per person",
  3: "about $25 to $90 per person",
  4: "about $50 and up per person",
};

/** What the chosen budget shows, in plain words, for the results banner. */
export function budgetRangeText(budget: number, outing?: OutingType): string {
  if (outing === "coffee" || outing === "dessert") return "any budget";
  return RANGE_TEXT[effectiveBudget(budget, outing)];
}

/** How many of this outing's venues sit at each price level (to say honestly what is typical). */
function levelCounts(outing: OutingType): number[] {
  const counts = [0, 0, 0, 0];
  for (const v of VENUES) if (getOutingTypes(v.id).includes(outing)) counts[v.priceLevel - 1]++;
  return counts;
}

/**
 * The line under the Budget chips. It says a higher budget is a ceiling, not
 * something you have to spend, and adds what's special about the mood.
 */
export function budgetCaption(budget: number | undefined, outing?: OutingType): string {
  if (outing === "coffee" || outing === "dessert") {
    const counts = levelCounts(outing);
    const total = counts.reduce((a, b) => a + b, 0);
    const word = outing === "coffee" ? "Coffee" : "Dessert";
    return counts[0] === total
      ? `${word} spots are all under $25 per person, so they show at any budget.`
      : `${word} spots are almost all under $25 per person, so they show at any budget.`;
  }
  if (budget === undefined) return "Per person. Pick the most you'd like to spend; you don't have to spend it all.";
  if (outing === "drinks" && budget > DRINKS_TOP_LEVEL) {
    return `Our priciest bars are ${"$".repeat(DRINKS_TOP_LEVEL)}, so ${"$".repeat(budget)} shows the same places. You don't have to spend it all.`;
  }
  return `Shows places ${RANGE_TEXT[effectiveBudget(budget, outing)]}. A higher budget is a ceiling, not a target.`;
}
