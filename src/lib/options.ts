// Display metadata for every selectable option in the preference flow.
// Edit labels, descriptions, or icons here to change copy across the whole app.

import {
  Heart,
  Coffee,
  Sparkles,
  RotateCcw,
  Shuffle,
  Flame,
  Wind,
  PartyPopper,
  Star,
  Zap,
  Compass,
  MapPin,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import type { DateType, Vibe, Neighborhood, PriceLevel, NotForMeReason } from "./types";

export interface OptionMeta<T extends string | number> {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const DATE_TYPE_OPTIONS: OptionMeta<DateType>[] = [
  {
    value: "first_date",
    label: "First date",
    description: "Low pressure, easy to talk",
    icon: Coffee,
  },
  {
    value: "casual",
    label: "Casual date",
    description: "Relaxed, no big occasion",
    icon: Wind,
  },
  {
    value: "anniversary",
    label: "Anniversary",
    description: "Meaningful and memorable",
    icon: Heart,
  },
  {
    value: "special_occasion",
    label: "Special occasion",
    description: "Worth dressing up for",
    icon: Star,
  },
  {
    value: "reconnecting",
    label: "Reconnecting",
    description: "It's been a while",
    icon: RotateCcw,
  },
  {
    value: "surprise_me",
    label: "Surprise me",
    description: "You pick the occasion",
    icon: Shuffle,
  },
];

export const VIBE_OPTIONS: OptionMeta<Vibe>[] = [
  {
    value: "cozy_intimate",
    label: "Cozy and intimate",
    description: "Quiet corners, low light",
    icon: Flame,
  },
  {
    value: "relaxed_casual",
    label: "Relaxed and casual",
    description: "Easy, unpretentious",
    icon: Wind,
  },
  {
    value: "lively_social",
    label: "Lively and social",
    description: "Buzzy energy, good people watching",
    icon: PartyPopper,
  },
  {
    value: "romantic",
    label: "Romantic",
    description: "Thoughtful, a little special",
    icon: Heart,
  },
  {
    value: "fun_playful",
    label: "Fun and playful",
    description: "Something to do together",
    icon: Zap,
  },
  {
    value: "trendy",
    label: "Trendy",
    description: "New, buzzed-about, stylish",
    icon: Sparkles,
  },
  {
    value: "something_different",
    label: "Something different",
    description: "Surprise us with the vibe",
    icon: Compass,
  },
];

export const NEIGHBORHOOD_OPTIONS: OptionMeta<Neighborhood>[] = [
  {
    value: "rittenhouse",
    label: "Rittenhouse",
    description: "Upscale, walkable, park views",
    icon: MapPin,
  },
  {
    value: "center_city",
    label: "Center City",
    description: "Central, easy to reach",
    icon: MapPin,
  },
  {
    value: "old_city",
    label: "Old City",
    description: "Cobblestones, historic charm",
    icon: MapPin,
  },
  {
    value: "fishtown",
    label: "Fishtown",
    description: "Indie, artsy, lively nights",
    icon: MapPin,
  },
  {
    value: "university_city",
    label: "University City",
    description: "Youthful, laid-back",
    icon: MapPin,
  },
  {
    value: "south_philly",
    label: "South Philly",
    description: "Neighborhood-y, unpretentious",
    icon: MapPin,
  },
];

export const BUDGET_OPTIONS: OptionMeta<PriceLevel>[] = [
  {
    value: 1,
    label: "$",
    description: "Under $25 / person",
    icon: DollarSign,
  },
  {
    value: 2,
    label: "$$",
    description: "$25–$50 / person",
    icon: DollarSign,
  },
  {
    value: 3,
    label: "$$$",
    description: "$50–$90 / person",
    icon: DollarSign,
  },
  {
    value: 4,
    label: "$$$$",
    description: "$90+ / person",
    icon: DollarSign,
  },
];

export function findOption<T extends string | number>(
  options: OptionMeta<T>[],
  value: T
): OptionMeta<T> {
  const found = options.find((o) => o.value === value);
  if (!found) {
    throw new Error(`Unknown option value: ${value}`);
  }
  return found;
}

export const PRICE_LABEL: Record<PriceLevel, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

export const NOT_FOR_ME_REASON_LABELS: Record<NotForMeReason, string> = {
  too_expensive: "Too expensive",
  too_far: "Too far",
  wrong_vibe: "Wrong vibe",
  too_formal: "Too formal",
  too_casual: "Too casual",
  already_been: "I've already been",
  not_interested: "Just not interested",
};
