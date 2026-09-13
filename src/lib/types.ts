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
export type IndoorOutdoor = "indoor" | "outdoor" | "both";

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
  indoorOutdoor: IndoorOutdoor;
  attributes: VenueAttributes;
  /** Short concrete phrases used to build "why it fits" copy, e.g. "dim lighting", "cozy booths" */
  tags: string[];
  reservationUrl?: string;
  websiteUrl?: string;
}

export interface DateFilters {
  food?: FoodDrinkActivity;
  indoorOutdoor?: IndoorOutdoor;
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
}

/**
 * Whether the current result set satisfies the user's neighborhood/budget
 * filters exactly, or had to relax one to fill out three results. The UI
 * uses this to explain itself instead of silently substituting venues.
 */
export interface RecommendationResult {
  results: ScoredVenue[];
  /** How many venues exist that match neighborhood + budget exactly (before any expansion). */
  exactMatchCount: number;
  /** Whether expanding to nearby neighborhoods would surface additional eligible venues. */
  canExpandNeighborhood: boolean;
  /** Whether allowing a higher budget would surface additional eligible venues. */
  canExpandBudget: boolean;
  /** Which relaxations are currently applied to produce `results`. */
  expanded: {
    neighborhood: boolean;
    budget: boolean;
  };
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
