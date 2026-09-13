import {
  MessagesSquare,
  Volume1,
  Volume2,
  VolumeX,
  Lightbulb,
  Clock,
  CalendarCheck,
  Sparkles,
  CloudSun,
  Shirt,
  Star,
  TreePine,
  type LucideIcon,
} from "lucide-react";
import type { Venue } from "./types";

export interface AttributeChip {
  icon: LucideIcon;
  label: string;
}

const NOISE_LABEL: Record<Venue["attributes"]["noiseLevel"], string> = {
  quiet: "Quiet — easy to talk",
  moderate: "Moderate noise",
  lively: "Lively energy",
};

const NOISE_ICON: Record<Venue["attributes"]["noiseLevel"], LucideIcon> = {
  quiet: VolumeX,
  moderate: Volume1,
  lively: Volume2,
};

const LIGHTING_LABEL: Record<Venue["attributes"]["lighting"], string> = {
  dim: "Dim, moody lighting",
  warm: "Warm lighting",
  bright: "Bright lighting",
};

const FORMALITY_LABEL: Record<Venue["attributes"]["formality"], string> = {
  casual: "Casual dress",
  smart_casual: "Smart casual",
  upscale: "Dress up a bit",
};

const RESERVATION_LABEL: Record<Venue["attributes"]["reservationDifficulty"], string> = {
  walk_in_friendly: "Walk-in friendly",
  recommended: "Reservation recommended",
  required: "Reservation required",
};

/** The handful of chips shown on a results card — kept short on purpose. */
export function getKeyAttributeChips(venue: Venue): AttributeChip[] {
  const a = venue.attributes;
  const chips: AttributeChip[] = [
    { icon: NOISE_ICON[a.noiseLevel], label: NOISE_LABEL[a.noiseLevel] },
  ];

  if (a.conversationFriendly >= 4) {
    chips.push({ icon: MessagesSquare, label: "Great for conversation" });
  }
  if (a.builtInActivity) {
    chips.push({ icon: Sparkles, label: "Built-in activity" });
  }
  if (a.memorable >= 4) {
    chips.push({ icon: Star, label: "Memorable" });
  }

  return chips.slice(0, 3);
}

/** The full attribute breakdown shown in the venue detail view. */
export function getFullAttributeList(venue: Venue): AttributeChip[] {
  const a = venue.attributes;
  return [
    { icon: NOISE_ICON[a.noiseLevel], label: NOISE_LABEL[a.noiseLevel] },
    { icon: Lightbulb, label: LIGHTING_LABEL[a.lighting] },
    { icon: MessagesSquare, label: `Conversation: ${a.conversationFriendly}/5` },
    { icon: Shirt, label: FORMALITY_LABEL[a.formality] },
    { icon: Clock, label: `Usually ${a.typicalTimeCommitment}` },
    { icon: CalendarCheck, label: RESERVATION_LABEL[a.reservationDifficulty] },
    ...(a.builtInActivity ? [{ icon: Sparkles, label: "Built-in activity" }] : []),
    ...(a.weatherDependent ? [{ icon: CloudSun, label: "Weather dependent" }] : []),
    // Only ever a positive claim — "no" and "unknown" both stay silent here
    // rather than asserting an absence we haven't fully verified either.
    ...(venue.outdoorSeating === "yes" ? [{ icon: TreePine, label: "Outdoor seating available" }] : []),
  ];
}
