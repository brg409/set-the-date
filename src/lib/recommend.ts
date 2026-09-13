import { VENUES } from "@/data/venues";
import { findOption, DATE_TYPE_OPTIONS } from "./options";
import type {
  DatePreferences,
  DateType,
  ExpansionState,
  RecommendationResult,
  ScoredVenue,
  Venue,
  VenueCategory,
  Vibe,
} from "./types";

/**
 * ── Recommendation engine ──────────────────────────────────────────────
 *
 * Two separate concerns, on purpose:
 *
 * 1. ELIGIBILITY (hard filters) — neighborhood and budget are constraints
 *    the user explicitly set, not preferences to be balanced against
 *    everything else. A venue in the wrong neighborhood or above budget is
 *    never shown unless the user is told and opts in to widen the search.
 *    See `isEligible` / `getEligibleVenues`.
 *
 * 2. RANKING (soft scoring) — once we know which venues are allowed to
 *    appear at all, occasion (date type) and vibe decide the order between
 *    them. See `rankVenue`.
 *
 * Keeping these separate is what makes "Rittenhouse stays Rittenhouse"
 * possible: expanding the pool is an explicit, visible user action
 * (`expand.neighborhood` / `expand.budget`), never an automatic scoring
 * side-effect.
 */

/** Tune ranking here. Only affects ORDER among already-eligible venues. */
export const RECOMMENDATION_WEIGHTS = {
  /** Exact date-type match (e.g. venue explicitly supports "first_date"). */
  dateTypeMatch: 4,
  /** Exact vibe match (e.g. venue explicitly supports "romantic"). */
  vibeMatch: 3,
};

// ── 1. Eligibility (hard filters) ──────────────────────────────────────
//
// Neighborhood, budget, indoor/outdoor, and food/drink/activity are all
// treated identically here: a constraint the user explicitly set is a wall,
// not a preference to balance against everything else. A venue that fails
// any selected hard filter is excluded from the pool entirely — it can
// never be scored into a top-3 slot by being strong on other axes. The only
// way a filter relaxes is `expand`, which the user opts into explicitly
// (see the results-page banner); it is never automatic.
//
// "unknown" on a factual attribute (e.g. `outdoorSeating: "unknown"`) is
// deliberately NOT the same as a match — an unverified fact must not be
// treated as satisfying the user's request.

const NO_EXPANSION: ExpansionState = {
  neighborhood: false,
  budget: false,
  indoorOutdoor: false,
  food: false,
};

function isEligible(venue: Venue, prefs: DatePreferences, expand: ExpansionState): boolean {
  const neighborhoodOk = expand.neighborhood || venue.neighborhood === prefs.neighborhood;
  // Budget is a ceiling, not an exact match — a cheaper venue than requested
  // is fine, a more expensive one is not, unless the user opts to expand.
  const budgetOk = expand.budget || venue.priceLevel <= prefs.budget;

  const wantedIO = prefs.filters?.indoorOutdoor;
  // "indoor" is satisfied by virtually every venue (see `hasIndoorSeating`).
  // "outdoor" requires a VERIFIED "yes" — "unknown" and "no" both fail, per
  // the rule that an unverified fact never counts as satisfying a request.
  const indoorOutdoorOk =
    expand.indoorOutdoor ||
    !wantedIO ||
    (wantedIO === "indoor" && venue.hasIndoorSeating) ||
    (wantedIO === "outdoor" && venue.outdoorSeating === "yes");

  const wantedFood = prefs.filters?.food;
  const foodOk =
    expand.food || !wantedFood || venue.foodDrinkActivity.includes(wantedFood);

  return neighborhoodOk && budgetOk && indoorOutdoorOk && foodOk;
}

function getEligibleVenues(prefs: DatePreferences, expand: ExpansionState): Venue[] {
  return VENUES.filter((v) => isEligible(v, prefs, expand));
}

// ── 2. Ranking (soft scoring among eligible venues) ────────────────────

function scoreDateType(venue: Venue, dateType: DateType): number {
  if (dateType === "surprise_me") {
    // No hard requirement for "surprise me" — every eligible venue is fair
    // game, so give flat partial credit rather than the full match bonus.
    return RECOMMENDATION_WEIGHTS.dateTypeMatch / 2;
  }
  return venue.dateTypes.includes(dateType) ? RECOMMENDATION_WEIGHTS.dateTypeMatch : 0;
}

function scoreVibe(venue: Venue, vibe: Vibe): number {
  if (vibe === "something_different") {
    // Reward novelty directly, scaled onto the same 0–vibeMatch range as an
    // exact vibe tag match — a novelty of 5 is worth exactly one normal
    // match, not more. (Previously this returned raw novelty, so a
    // high-novelty venue could outscore an exact match on every OTHER vibe,
    // which is why novelty-heavy venues like Escape The Room dominated far
    // more combinations than their actual fit warranted.)
    return (venue.attributes.novelty / 5) * RECOMMENDATION_WEIGHTS.vibeMatch;
  }
  return venue.vibes.includes(vibe) ? RECOMMENDATION_WEIGHTS.vibeMatch : 0;
}

/**
 * Bonus points for attributes that matter most for a given date type / vibe
 * combo. Deliberately continuous (e.g. `(a.memorable - 3) * 1`) rather than
 * threshold-based (e.g. `if (memorable >= 4) +2`): a threshold collapses a 4
 * and a 5 into the same bonus, which — with several similarly-upscale
 * venues in the same category — produced ties resolved only by array order,
 * permanently hiding half of them. Continuous scoring lets the actual
 * differences between venues' attribute values show through in the ranking.
 * "3" is the neutral midpoint of every 1–5 attribute scale in the schema.
 */
function scoreSecondaryAttributes(venue: Venue, prefs: DatePreferences): number {
  const a = venue.attributes;
  let bonus = 0;

  switch (prefs.dateType) {
    case "first_date":
      bonus += a.goodForFirstMeeting ? 2 : 0;
      bonus += (a.conversationFriendly - 3) * 0.5;
      break;
    case "anniversary":
    case "special_occasion":
      bonus += (a.memorable - 3) * 1;
      bonus += (a.romantic - 3) * 0.75;
      break;
    case "reconnecting":
      bonus += (a.conversationFriendly - 3) * 0.75;
      bonus += a.easyToExtend ? 1 : 0;
      break;
    case "casual":
      bonus += a.formality === "casual" ? 1 : 0;
      bonus += a.easyToExtend ? 1 : 0;
      break;
    case "surprise_me":
      bonus += (a.novelty - 3) * 0.5;
      break;
  }

  switch (prefs.vibe) {
    case "romantic":
      // The venue's own `romantic` rating is the primary signal — lighting
      // and quiet are supporting evidence, not substitutes for it. Without
      // this, a quiet, warmly-lit bakery scored the same "romantic" bonus
      // as an actually candlelit restaurant purely from ambient proxies,
      // which is how a bakery-luncheonette ended up ranking for romantic
      // searches despite not being tagged (or being) romantic at all.
      bonus += (a.romantic - 3) * 1.25;
      bonus += a.lighting !== "bright" ? 0.5 : 0;
      bonus += a.noiseLevel === "quiet" ? 0.5 : a.noiseLevel === "lively" ? -0.5 : 0;
      break;
    case "cozy_intimate":
      // Cozy/intimate is about scale and calm, not romance specifically —
      // a quiet daytime cafe can genuinely be cozy without being romantic.
      bonus += (a.romantic - 3) * 0.4;
      bonus += a.lighting !== "bright" ? 1 : 0;
      bonus += a.noiseLevel === "quiet" ? 1 : a.noiseLevel === "lively" ? -1 : 0;
      break;
    case "lively_social":
    case "trendy":
      bonus += (a.energy - 3) * 0.75;
      break;
    case "fun_playful":
    case "something_different":
      bonus += a.builtInActivity ? 2 : 0;
      break;
    case "relaxed_casual":
      bonus += (3 - a.energy) * 0.5;
      break;
  }

  return bonus;
}

/**
 * Ranks an already-eligible venue. Neighborhood, budget, indoor/outdoor, and
 * food/drink/activity are NOT scored here — they're hard filters (see
 * `isEligible`), so every venue reaching this function already satisfies
 * them equally; there's nothing left to differentiate on that basis.
 */
export function rankVenue(venue: Venue, prefs: DatePreferences): number {
  return (
    scoreDateType(venue, prefs.dateType) +
    scoreVibe(venue, prefs.vibe) +
    scoreSecondaryAttributes(venue, prefs)
  );
}

// ── 3. "Why it fits" copy ───────────────────────────────────────────────

const DATE_TYPE_LABEL: Record<DateType, string> = {
  first_date: "first date",
  casual: "casual date",
  anniversary: "anniversary",
  special_occasion: "special occasion",
  reconnecting: "catch-up",
  surprise_me: "surprise-me date",
};

const VIBE_WANT_PHRASE: Record<Vibe, string> = {
  cozy_intimate: "something intimate but not overly formal",
  relaxed_casual: "something easy and low-key",
  lively_social: "something with real energy in the room",
  romantic: "something that feels thoughtful, not clichéd",
  fun_playful: "something with a bit of play built in",
  trendy: "something that feels current",
  something_different: "something outside the usual dinner-and-drinks script",
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
 * The second sentence of a "why it fits" explanation. Picks ONE concrete,
 * verified comparison based on the venue's actual attributes — never a
 * generic filler line — so two venues sharing a vibe don't read as
 * identical. Every branch only fires when the underlying attribute
 * actually supports the claim.
 */
function buildSpecificClaim(venue: Venue, prefs: DatePreferences): string {
  const a = venue.attributes;

  if (a.builtInActivity) {
    return "The built-in activity means you're never just sitting across a table with nothing to do.";
  }
  if (a.conversationFriendly >= 4 && a.noiseLevel === "quiet") {
    return "It's quiet enough that conversation never has to compete with the room.";
  }
  if (a.noiseLevel === "lively" && a.energy >= 4) {
    return "Expect real energy in the room — good if you want the date to feel a little electric rather than hushed.";
  }
  if (a.formality === "upscale") {
    return "It's dressier than most spots on this list, so it fits best when the occasion actually calls for it.";
  }
  if (a.romantic >= 4) {
    return "It reads as romantic without tipping into stiff or overly formal.";
  }
  if (a.reservationDifficulty === "walk_in_friendly" && prefs.dateType === "casual") {
    return "No reservation needed, so it stays low-pressure if plans change.";
  }
  if (a.easyToExtend) {
    return "It's easy to extend the night somewhere else afterward if things are going well.";
  }
  if (a.memorable >= 4) {
    return "It's the kind of place that's genuinely memorable, not just convenient.";
  }
  return "It fits the vibe you're going for without overselling it.";
}

/**
 * Builds the "why it fits" copy from a venue's own tags + attributes and the
 * user's selections. Template-based on purpose — fully deterministic and
 * easy to debug — but structured so each sentence only ever states things
 * the venue's data actually supports. Swapping this for an AI-generated
 * explanation later means replacing this function's body with a model call
 * that receives the same `(venue, prefs)` inputs; nothing upstream changes.
 */
export function generateWhyItFits(venue: Venue, prefs: DatePreferences): string {
  const tags = venue.tags.slice(0, 3);
  const tagSentence = capitalize(joinWithAnd(tags));
  const dateTypeLabel = DATE_TYPE_LABEL[prefs.dateType];
  const claim = buildSpecificClaim(venue, prefs);

  // The "when you want [vibe]" clause asserts the venue actually delivers
  // that vibe. Only make that claim when the venue is genuinely tagged with
  // it — otherwise this venue only surfaced because the eligible pool for
  // the selected hard filters was small, and the vibe claim would be
  // unsupported (e.g. a coffee shop shown for "romantic" purely because it
  // was one of the only outdoor-seating options left at that budget).
  if (venue.vibes.includes(prefs.vibe)) {
    const wantPhrase = VIBE_WANT_PHRASE[prefs.vibe];
    return `${tagSentence} make ${venue.name} a strong ${dateTypeLabel} option when you want ${wantPhrase}. ${claim}`;
  }

  return `${tagSentence} make ${venue.name} a solid ${dateTypeLabel} option here, even if it's not a classic pick for that vibe. ${claim}`;
}

function scoreAndExplain(venue: Venue, prefs: DatePreferences, isExpandedMatch: boolean): ScoredVenue {
  return {
    venue,
    score: rankVenue(venue, prefs),
    whyItFits: generateWhyItFits(venue, prefs),
    matchedTags: venue.tags.slice(0, 3),
    isExpandedMatch,
  };
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

// ── 4. Variety ───────────────────────────────────────────────────────────

/** Broad grouping so three results don't all feel like the same kind of place. */
function getVenueBucket(category: VenueCategory): string {
  switch (category) {
    case "cocktail_bar":
    case "wine_bar":
    case "brewery":
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

/**
 * Repeat penalties for variety, applied per venue ALREADY picked that shares
 * a bucket/category with the candidate. These are intentionally small
 * relative to the ranking weights above (dateTypeMatch + vibeMatch alone is
 * 7, before any secondary bonus): a close call between two
 * similarly-good venues can flip toward the more varied one, but a venue
 * that's a genuinely much better fit always wins regardless of category.
 * Raise these to push harder for variety; lower them (or zero them) to rank
 * on fit alone.
 */
const DIVERSITY_PENALTY = {
  sameBucket: 2.5, // e.g. a second cocktail bar when a wine bar scored close behind
  sameCategory: 1.5, // additional penalty for the exact same category, not just the same bucket
};

/**
 * Greedily selects `count` results from a score-sorted list. Unlike a hard
 * "max N per category" cutoff, this ranks by score minus a small penalty for
 * each already-picked venue sharing a bucket/category — so three genuinely
 * excellent cocktail bars can still all appear if nothing else comes close,
 * but a near-tie will resolve in favor of variety (e.g. cocktail bar +
 * restaurant + coffee shop over three interchangeable cocktail bars).
 */
function diversify(sorted: ScoredVenue[], count: number): ScoredVenue[] {
  const result: ScoredVenue[] = [];
  const bucketCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const remaining = [...sorted];

  while (result.length < count && remaining.length > 0) {
    let bestIndex = 0;
    let bestAdjustedScore = -Infinity;

    remaining.forEach((candidate, index) => {
      const bucket = getVenueBucket(candidate.venue.category);
      const penalty =
        (bucketCounts.get(bucket) ?? 0) * DIVERSITY_PENALTY.sameBucket +
        (categoryCounts.get(candidate.venue.category) ?? 0) * DIVERSITY_PENALTY.sameCategory;
      const adjustedScore = candidate.score - penalty;
      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    });

    const [picked] = remaining.splice(bestIndex, 1);
    result.push(picked);
    const bucket = getVenueBucket(picked.venue.category);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
    categoryCounts.set(picked.venue.category, (categoryCounts.get(picked.venue.category) ?? 0) + 1);
  }

  return result;
}

// ── 5. Public API ────────────────────────────────────────────────────────

export interface RecommendationOptions {
  excludeIds?: string[];
  count?: number;
  /** Explicit user opt-in to relax neighborhood/budget. Defaults to no expansion. */
  expand?: Partial<ExpansionState>;
}

export function getRecommendations(
  prefs: DatePreferences,
  options: RecommendationOptions = {}
): RecommendationResult {
  const count = options.count ?? 3;
  const excludeSet = new Set(options.excludeIds ?? []);
  const expand: ExpansionState = { ...NO_EXPANSION, ...options.expand };

  const exactPool = getEligibleVenues(prefs, NO_EXPANSION);
  const exactMatchCount = exactPool.length;
  const currentPoolSize = getEligibleVenues(prefs, expand).length;

  /** Would relaxing just this ONE dimension (on top of whatever's already expanded) help? */
  function canExpand(dimension: keyof ExpansionState): boolean {
    if (expand[dimension]) return false; // already relaxed
    return getEligibleVenues(prefs, { ...expand, [dimension]: true }).length > currentPoolSize;
  }

  const canExpandNeighborhood = canExpand("neighborhood");
  const canExpandBudget = canExpand("budget");
  const canExpandIndoorOutdoor = canExpand("indoorOutdoor");
  const canExpandFood = canExpand("food");

  let pool = getEligibleVenues(prefs, expand).filter((v) => !excludeSet.has(v.id));
  if (pool.length < count) {
    // Ran out of fresh venues within the eligible pool — restart the
    // rotation (still respecting the same firm filters) rather than
    // returning fewer than three, or silently pulling from elsewhere.
    pool = getEligibleVenues(prefs, expand);
  }

  const exactIds = new Set(exactPool.map((v) => v.id));
  const scored = pool
    .map((v) => scoreAndExplain(v, prefs, !exactIds.has(v.id)))
    .sort((a, b) => b.score - a.score);

  return {
    results: diversify(scored, count),
    exactMatchCount,
    canExpandNeighborhood,
    canExpandBudget,
    canExpandIndoorOutdoor,
    canExpandFood,
    expanded: expand,
  };
}

/** Convenience label used by result-set copy, e.g. "first date". */
export function getDateTypeLabel(dateType: DateType): string {
  return findOption(DATE_TYPE_OPTIONS, dateType).label;
}

/**
 * Finds a single best replacement venue for "Not for me" — deliberately
 * does NOT wrap around to previously-seen venues the way `getRecommendations`
 * does for "show me different spots", so a dismissed (or already-shown)
 * venue can never silently reappear as its own replacement. Returns null
 * when nothing eligible is left, so the UI can show one fewer card rather
 * than a duplicate.
 */
export function getReplacementVenue(
  prefs: DatePreferences,
  expand: ExpansionState,
  excludeIds: string[]
): ScoredVenue | null {
  const excludeSet = new Set(excludeIds);
  const pool = getEligibleVenues(prefs, expand).filter((v) => !excludeSet.has(v.id));
  if (pool.length === 0) return null;

  const exactIds = new Set(getEligibleVenues(prefs, NO_EXPANSION).map((v) => v.id));
  const [best] = pool
    .map((v) => scoreAndExplain(v, prefs, !exactIds.has(v.id)))
    .sort((a, b) => b.score - a.score);
  return best;
}
