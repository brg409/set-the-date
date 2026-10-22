// The "What are you in the mood for?" options and how venues map to them.
// The per-venue classification itself lives in src/data/outingTypes.ts.

import { ANYTHING_ONLY, OUTING_CLASSIFICATION } from "@/data/outingTypes";
import type { OutingType } from "./types";

export const OUTING_TYPES: OutingType[] = ["dinner", "drinks", "coffee", "dessert", "activity"];

export const OUTING_OPTIONS: { value: OutingType; label: string }[] = [
  { value: "dinner", label: "Dinner" },
  { value: "drinks", label: "Drinks" },
  { value: "coffee", label: "Coffee" },
  { value: "dessert", label: "Dessert" },
  { value: "activity", label: "Activity" },
];

export const ANYTHING_LABEL = "Anything";

export function isOutingType(value: unknown): value is OutingType {
  return typeof value === "string" && (OUTING_TYPES as string[]).includes(value);
}

export function outingLabel(type: OutingType): string {
  return OUTING_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

/** The outing types a venue is classified for (possibly none). */
export function getOutingTypes(venueId: string): OutingType[] {
  const entry = OUTING_CLASSIFICATION[venueId];
  return entry ? OUTING_TYPES.filter((t) => entry[t] !== undefined) : [];
}

export function venueHasOutingType(venueId: string, type: OutingType): boolean {
  return OUTING_CLASSIFICATION[venueId]?.[type] !== undefined;
}

/** Venues deliberately left without a specific type (found through Anything only). */
export function isAnythingOnly(venueId: string): boolean {
  return ANYTHING_ONLY.includes(venueId);
}

/** Old Find links used `food=food|drinks|activity`; they map onto the new moods. */
export function outingFromLegacyFood(food: unknown): OutingType | undefined {
  if (food === "food") return "dinner";
  if (food === "drinks") return "drinks";
  if (food === "activity") return "activity";
  return undefined;
}
