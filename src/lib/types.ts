// Core domain types for Set the Date.
// Kept separate from data/logic so a future real data provider (Google Places, etc.)
// only needs to produce values that satisfy these shapes.

export type DateType =
  | "first_date"
  | "casual"
  | "anniversary"
  | "special_occasion"
  | "reconnecting"
  | "surprise_me";

/**
 * ── Tagging guidelines ──────────────────────────────────────────────────
 * A venue should only carry a `Vibe` or `DateType` tag it actually earns —
 * these are not "coverage" checkboxes to tick for exposure. Apply these
 * definitions when adding or auditing a venue:
 *
 * Vibes:
 * - cozy_intimate: smaller scale, comfortable seating, lower energy,
 *   conversation-friendly. Does NOT require romance — a quiet daytime cafe
 *   can be cozy_intimate without being romantic.
 * - relaxed_casual: low-pressure, approachable, not overly formal.
 * - lively_social: noticeable energy, crowds, music, or people-watching;
 *   conversation may take a back seat to atmosphere.
 * - romantic: intentional atmosphere, seating/lighting/setting suited to
 *   two people, and an experience that credibly feels special. Requires a
 *   genuinely elevated or intimate setting — being quiet or warmly lit is
 *   not sufficient on its own (a bakery-luncheonette is not romantic).
 * - fun_playful: a built-in activity, interactive element, or experience
 *   beyond simply eating or drinking.
 * - trendy: currently stylish, distinctive, or culturally buzzed-about —
 *   not simply "upscale" or "classic" (an old-school steakhouse from 1997
 *   is not trendy even if it's excellent).
 * - something_different: a genuinely unusual format, concept, environment,
 *   or activity — not just "a bit livelier than average."
 *
 * Date types:
 * - first_date: conversation-friendly, or includes a low-pressure activity.
 * - casual: approachable, flexible, low commitment.
 * - anniversary: memorable, intentional, capable of feeling special —
 *   requires real evidence of romance/ceremony, not just "nice restaurant."
 * - special_occasion: elevated service, setting, experience, or
 *   celebration value.
 * - reconnecting: comfortable, conversation-friendly, suited to spending
 *   real time together (not a rushed quick-service spot).
 *
 * When a venue's actual character doesn't clearly satisfy one of these,
 * leave the tag off rather than including it "to be safe" or for coverage.
 */
export type Vibe =
  | "cozy_intimate"
  | "relaxed_casual"
  | "lively_social"
  | "romantic"
  | "fun_playful"
  | "trendy"
  | "something_different";

export type Neighborhood =
  | "rittenhouse"
  | "center_city"
  | "old_city"
  | "fishtown"
  | "university_city"
  | "south_philly";

/** 1 = $, 2 = $$, 3 = $$$, 4 = $$$$ */
export type PriceLevel = 1 | 2 | 3 | 4;

export type VenueCategory =
  | "cocktail_bar"
  | "wine_bar"
  | "restaurant"
  | "rooftop_bar"
  | "cafe"
  | "activity"
  | "brewery"
  | "dessert";

export type FoodDrinkActivity = "food" | "drinks" | "activity";

export type NoiseLevel = "quiet" | "moderate" | "lively";
export type Lighting = "dim" | "warm" | "bright";
export type Formality = "casual" | "smart_casual" | "upscale";
export type ReservationDifficulty =
  | "walk_in_friendly"
  | "recommended"
  | "required";
/**
 * Deliberately two separate facts, not one "indoor | outdoor | both" enum.
 * Virtually every restaurant/bar/cafe has SOME indoor seating — that's
 * rarely the uncertain fact. Outdoor seating is the fact that's actually in
 * doubt for a given venue, so it gets its own tri-state:
 *
 * - "yes": verified — a patio, sidewalk seating, courtyard, rooftop, etc.
 * - "no": verified absence (e.g. a below-street speakeasy with no windows).
 * - "unknown": not verified either way. This is a REAL state, not a
 *   placeholder for "no" — it must never satisfy a user's "outdoor" filter.
 *   See `isEligible` in recommend.ts.
 */
export type OutdoorSeatingStatus = "yes" | "no" | "unknown";

/** The user's preference when they select the optional indoor/outdoor filter. */
export type IndoorOutdoorPreference = "indoor" | "outdoor";

export interface VenueAttributes {
  /** 1 (hard to talk) - 5 (very easy to talk) */
  conversationFriendly: number;
  noiseLevel: NoiseLevel;
  lighting: Lighting;
  seatingStyle: string;
  /** 1 (not romantic) - 5 (very romantic) */
  romantic: number;
  formality: Formality;
  /** 1 (low key) - 5 (high energy) */
  energy: number;
  builtInActivity: boolean;
  typicalTimeCommitment: string;
  easyToExtend: boolean;
  goodForFirstMeeting: boolean;
  /** 1 - 5, how memorable / special the spot feels */
  memorable: number;
  weatherDependent: boolean;
  reservationDifficulty: ReservationDifficulty;
  /** 1 - 5, how well this fits "surprise me" / "something different" requests */
  novelty: number;
}

export interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  categoryLabel: string;
  neighborhood: Neighborhood;
  priceLevel: PriceLevel;
  pricePerPerson: [number, number];
  address: string;
  /** Optional real photo. Falls back to a generated placeholder when absent. */
  imageUrl?: string;
  description: string;
  dateTypes: DateType[];
  vibes: Vibe[];
  foodDrinkActivity: FoodDrinkActivity[];
  /** Almost always true for a conventional restaurant/bar/cafe — false only for a genuinely outdoor-only activity. */
  hasIndoorSeating: boolean;
  /** The fact actually worth verifying per-venue. See `OutdoorSeatingStatus`. */
  outdoorSeating: OutdoorSeatingStatus;
  /**
   * Whether the venue itself serves alcohol (BYOB counts as `false` here —
   * the venue isn't the one serving it). Tracked so an alcohol/no-alcohol
   * filter can be added later without re-auditing every venue; there is no
   * such filter in the UI yet, so this is not currently enforced as a hard
   * constraint anywhere.
   */
  servesAlcohol: boolean;
  attributes: VenueAttributes;
  /** Short concrete phrases used to build "why it fits" copy, e.g. "dim lighting", "cozy booths" */
  tags: string[];
  reservationUrl?: string;
  websiteUrl?: string;
  /**
   * Evidence trail for factual claims (mainly `outdoorSeating` today). Not
   * shown in the UI — its purpose is to make future audits possible and to
   * discourage guessing: if you can't say where a fact came from, it
   * probably belongs in `verificationNotes` as an open question, and the
   * field itself should be "unknown" rather than a guess.
   */
  attributeSources?: string;
  /** ISO date (YYYY-MM-DD) this record's factual attributes were last checked against a real source. */
  lastVerified?: string;
  /** Caveats a factual attribute doesn't fully capture, e.g. "outdoor seating is seasonal, closed Nov–Mar". */
  verificationNotes?: string;
  /**
   * The venue's Google Places (New) place ID (format `ChIJ...`), used
   * server-side only to look up live photo metadata — see
   * `src/lib/googlePlaces.ts`. Never sent to the client and never used to
   * permanently store a photo resource name (those expire). Left unset for
   * a venue until it's been verified against a real Google Places result;
   * an unset value simply falls back to the category illustration.
   */
  googlePlaceId?: string;
  /**
   * Google does not expose a semantic "this photo shows outdoor seating"
   * label, so true automatic selection isn't possible from the API alone.
   * This is a manual curation hook: after visually checking a venue's
   * Google Photos, set this to the 0-based index (within the first 3
   * photos we ever fetch) of the photo that best shows outdoor seating, so
   * `/api/venue-photo` can prefer it when the user has selected the
   * outdoor filter. Leave unset to just use the default (first) photo.
   */
  googlePhotoOutdoorIndex?: number;
}

export interface DateFilters {
  food?: FoodDrinkActivity;
  indoorOutdoor?: IndoorOutdoorPreference;
  maxTravelMinutes?: number;
  alcohol?: "yes" | "no";
  dietary?: string;
}

export interface DatePreferences {
  dateType: DateType;
  vibe: Vibe;
  neighborhood: Neighborhood;
  budget: PriceLevel;
  filters?: DateFilters;
}

export interface ScoredVenue {
  venue: Venue;
  score: number;
  whyItFits: string;
  matchedTags: string[];
  /** True when this result required relaxing the user's neighborhood and/or budget filter. */
  isExpandedMatch?: boolean;
}

export interface ExpansionState {
  /** Include venues outside the selected neighborhood. */
  neighborhood: boolean;
  /** Include venues priced above the selected budget. */
  budget: boolean;
  /** Ignore the indoor/outdoor filter (if one was selected). */
  indoorOutdoor: boolean;
  /** Ignore the food/drinks/activity filter (if one was selected). */
  food: boolean;
}

/**
 * Whether the current result set satisfies the user's neighborhood/budget
 * filters exactly, or had to relax one to fill out three results. The UI
 * uses this to explain itself instead of silently substituting venues.
 */
export interface RecommendationResult {
  results: ScoredVenue[];
  /** How many venues exist that match every selected hard filter exactly (before any expansion). */
  exactMatchCount: number;
  /** Whether expanding to nearby neighborhoods would surface additional eligible venues. */
  canExpandNeighborhood: boolean;
  /** Whether allowing a higher budget would surface additional eligible venues. */
  canExpandBudget: boolean;
  /** Whether dropping the indoor/outdoor filter would surface additional eligible venues. */
  canExpandIndoorOutdoor: boolean;
  /** Whether dropping the food/drinks/activity filter would surface additional eligible venues. */
  canExpandFood: boolean;
  /** Which relaxations are currently applied to produce `results`. */
  expanded: ExpansionState;
}

export const NOT_FOR_ME_REASONS = [
  "too_expensive",
  "too_far",
  "wrong_vibe",
  "too_formal",
  "too_casual",
  "already_been",
  "not_interested",
] as const;

export type NotForMeReason = (typeof NOT_FOR_ME_REASONS)[number];

/** A single "not for me" event, kept locally so it could later inform personalization. */
export interface VenueFeedback {
  venueId: string;
  reason: NotForMeReason | null;
  dateType: DateType;
  vibe: Vibe;
  neighborhood: Neighborhood;
  createdAt: string;
}
