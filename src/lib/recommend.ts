import { VENUES } from "@/data/venues";
import type { DatePreferences, DateType, ScoredVenue, Venue, Vibe } from "./types";

/**
 * Tune the recommendation engine here. Nothing else in the app needs to
 * change if these weights move — scoring, diversity, and copy generation
 * all read from this file.
 */
export const RECOMMENDATION_WEIGHTS = {
  dateTypeMatch: 4,
  vibeMatch: 3,
  neighborhoodMatch: 3,
  budgetExactMatch: 2,
  budgetStepPenalty: 1,
  secondaryAttributeMax: 3,
  filterMatch: 1,
};

function scoreDateType(venue: Venue, dateType: DateType): number {
  if (dateType === "surprise_me") {
    // No hard requirement — every venue is "in play" for a surprise, so we
    // give a flat partial credit rather than the full exact-match bonus.
    return RECOMMENDATION_WEIGHTS.dateTypeMatch / 2;
  }
  return venue.dateTypes.includes(dateType)
    ? RECOMMENDATION_WEIGHTS.dateTypeMatch
    : 0;
}

function scoreVibe(venue: Venue, vibe: Vibe): number {
  if (vibe === "something_different") {
    // Reward novelty directly instead of requiring an exact vibe tag match.
    return venue.attributes.novelty;
  }
  return venue.vibes.includes(vibe) ? RECOMMENDATION_WEIGHTS.vibeMatch : 0;
}

function scoreBudget(venue: Venue, budget: number): number {
  const diff = Math.abs(venue.priceLevel - budget);
  if (diff === 0) return RECOMMENDATION_WEIGHTS.budgetExactMatch;
  return -diff * RECOMMENDATION_WEIGHTS.budgetStepPenalty;
}

/** Bonus points for attributes that matter most for a given date type / vibe combo. */
function scoreSecondaryAttributes(venue: Venue, prefs: DatePreferences): number {
  const a = venue.attributes;
  let bonus = 0;

  switch (prefs.dateType) {
    case "first_date":
      if (a.goodForFirstMeeting) bonus += 2;
      if (a.conversationFriendly >= 4) bonus += 1;
      break;
    case "anniversary":
    case "special_occasion":
      if (a.memorable >= 4) bonus += 2;
      if (a.romantic >= 4) bonus += 1;
      break;
    case "reconnecting":
      if (a.conversationFriendly >= 4) bonus += 2;
      if (a.easyToExtend) bonus += 1;
      break;
    case "casual":
      if (a.formality === "casual") bonus += 1;
      if (a.easyToExtend) bonus += 1;
      break;
    case "surprise_me":
      bonus += Math.min(2, Math.round(a.novelty / 2));
      break;
  }

  switch (prefs.vibe) {
    case "cozy_intimate":
    case "romantic":
      if (a.lighting !== "bright") bonus += 1;
      if (a.noiseLevel === "quiet") bonus += 1;
      break;
    case "lively_social":
    case "trendy":
      if (a.energy >= 4) bonus += 1;
      break;
    case "fun_playful":
    case "something_different":
      if (a.builtInActivity) bonus += 2;
      break;
    case "relaxed_casual":
      if (a.energy <= 3) bonus += 1;
      break;
  }

  return Math.min(bonus, RECOMMENDATION_WEIGHTS.secondaryAttributeMax * 2);
}

function scoreFilters(venue: Venue, prefs: DatePreferences): number {
  const filters = prefs.filters;
  if (!filters) return 0;
  let bonus = 0;
  if (filters.food && venue.foodDrinkActivity.includes(filters.food)) {
    bonus += RECOMMENDATION_WEIGHTS.filterMatch;
  }
  if (
    filters.indoorOutdoor &&
    (venue.indoorOutdoor === filters.indoorOutdoor || venue.indoorOutdoor === "both")
  ) {
    bonus += RECOMMENDATION_WEIGHTS.filterMatch;
  }
  return bonus;
}

export function scoreVenue(venue: Venue, prefs: DatePreferences): number {
  return (
    scoreDateType(venue, prefs.dateType) +
    scoreVibe(venue, prefs.vibe) +
    (venue.neighborhood === prefs.neighborhood
      ? RECOMMENDATION_WEIGHTS.neighborhoodMatch
      : 0) +
    scoreBudget(venue, prefs.budget) +
    scoreSecondaryAttributes(venue, prefs) +
    scoreFilters(venue, prefs)
  );
}

const VIBE_ADJECTIVE: Record<Vibe, string> = {
  cozy_intimate: "cozy and easy to settle into",
  relaxed_casual: "relaxed without feeling like an afterthought",
  lively_social: "lively without being overwhelming",
  romantic: "thoughtful without being overly formal",
  fun_playful: "playful and a little different",
  trendy: "current without feeling like just a scene",
  something_different: "unlike the usual date-night script",
};

const DATE_TYPE_PHRASE: Record<DateType, string> = {
  first_date: "a first date where you want easy conversation",
  casual: "a casual date that doesn't need to be a big production",
  anniversary: "an anniversary you want to feel special",
  special_occasion: "an occasion worth marking",
  reconnecting: "reconnecting somewhere relaxed enough to actually catch up",
  surprise_me: "a date where the destination is half the fun",
};

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Builds the "why it fits" copy from a venue's tags + the user's selections.
 *
 * This is template-based on purpose: it is fully deterministic and easy to
 * debug for the MVP. Because it only depends on `venue.tags` and `prefs`,
 * swapping this out for an AI-generated explanation later just means
 * replacing this function's body with a model call that receives the same
 * inputs — nothing upstream (scoring, UI) needs to change.
 */
export function generateWhyItFits(venue: Venue, prefs: DatePreferences): string {
  const tags = venue.tags.slice(0, 3);
  const tagSentence = capitalize(joinWithAnd(tags));
  const adjective = VIBE_ADJECTIVE[prefs.vibe];
  const phrase = DATE_TYPE_PHRASE[prefs.dateType];
  return `${tagSentence} make it feel ${adjective}. It's especially good for ${phrase}.`;
}

function scoreAndExplain(venue: Venue, prefs: DatePreferences): ScoredVenue {
  return {
    venue,
    score: scoreVenue(venue, prefs),
    whyItFits: generateWhyItFits(venue, prefs),
    matchedTags: venue.tags.slice(0, 3),
  };
}

/**
 * Greedily selects `count` results from a score-sorted list while avoiding
 * more than two picks from the same venue category, so the three results
 * don't all feel interchangeable.
 */
function diversify(sorted: ScoredVenue[], count: number): ScoredVenue[] {
  const result: ScoredVenue[] = [];
  const categoryCounts = new Map<string, number>();
  const remaining = [...sorted];

  while (result.length < count && remaining.length > 0) {
    let index = remaining.findIndex(
      (sv) => (categoryCounts.get(sv.venue.category) ?? 0) < 2
    );
    if (index === -1) index = 0;
    const [picked] = remaining.splice(index, 1);
    result.push(picked);
    categoryCounts.set(
      picked.venue.category,
      (categoryCounts.get(picked.venue.category) ?? 0) + 1
    );
  }

  return result;
}

export interface RecommendationOptions {
  excludeIds?: string[];
  count?: number;
}

/**
 * Used where we need "why it fits" copy but have no active search (e.g. the
 * Saved page) — builds a plausible preference set from the venue's own
 * strongest-supported date type and vibe.
 */
export function getDefaultWhyItFits(venue: Venue): string {
  const prefs: DatePreferences = {
    dateType: venue.dateTypes[0],
    vibe: venue.vibes[0],
    neighborhood: venue.neighborhood,
    budget: venue.priceLevel,
  };
  return generateWhyItFits(venue, prefs);
}

export function getRecommendations(
  prefs: DatePreferences,
  options: RecommendationOptions = {}
): ScoredVenue[] {
  const count = options.count ?? 3;
  const excludeSet = new Set(options.excludeIds ?? []);

  let pool = VENUES.filter((v) => !excludeSet.has(v.id));
  if (pool.length < count) {
    // Ran out of fresh venues to show — start the rotation over rather than
    // returning fewer than three results.
    pool = VENUES;
  }

  const scored = pool.map((v) => scoreAndExplain(v, prefs)).sort((a, b) => b.score - a.score);
  return diversify(scored, count);
}
