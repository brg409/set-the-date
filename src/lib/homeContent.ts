// What the homepage shows. Venue ids point at the existing curated database;
// nothing here duplicates or invents venue data, and the photos come from the
// same Google Places route as the rest of the app.

import { getVenueById } from "@/data/venues";
import type { DateType, Venue } from "./types";

export const HOME_COPY = {
  headlineTop: "Know the place.",
  headlineBottom: "Love the night.",
  supporting:
    "Great spots, picked for your occasion, vibe, and preferences. Skip the endless scrolling and find somewhere worth going.",
  cta: "Find Me a Place",
  quickStartHeading: "What's the occasion?",
  quickStartSub: "Pick one and we'll start your search.",
  featuredHeading: "Places worth knowing",
  featuredSub: "A few favorites from our Philadelphia collection.",
  howHeading: "How it works",
  finalHeading: "Your next favorite spot is waiting.",
};

export const HOW_IT_WORKS = [
  { title: "Set your vibe", body: "Tell us what you're looking for." },
  { title: "Get three picks", body: "Discover places selected for your preferences." },
  { title: "Make it happen", body: "Explore, save, and book your favorite." },
];

/** Hero collage: first is the large tile. */
export const HERO_VENUE_IDS = ["parc", "buddakan", "library-bar"];

/** A restaurant, a cocktail bar, and an activity bar. */
export const FEATURED_VENUE_IDS = [
  "wm-mulherins-sons",
  "franklin-mortgage-investment-co",
  "barcade-fishtown",
];

/**
 * A shorter line for a featured card, used only where the venue's own
 * description would make the three cards uneven. Each one is a clause-boundary
 * trim of that description (checked in the tests) — nothing is added.
 */
export const FEATURED_BLURBS: Record<string, string> = {
  "franklin-mortgage-investment-co":
    "An unmarked, award-winning speakeasy behind an anonymous door just off Rittenhouse Square.",
};

/** Existing occasion values only; labels and icons come from options.ts. */
export const QUICK_START_OCCASIONS: DateType[] = [
  "first_date",
  "casual",
  "anniversary",
  "special_occasion",
  "surprise_me",
];

export function venuesFromIds(ids: string[]): Venue[] {
  return ids.map(getVenueById).filter((v): v is Venue => Boolean(v));
}
