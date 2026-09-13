"use client";

import { Bookmark } from "lucide-react";
import { useSavedVenues } from "@/hooks/useSavedVenues";

export function SaveButton({
  venueId,
  size = "md",
}: {
  venueId: string;
  size?: "sm" | "md";
}) {
  const { isSaved, toggle } = useSavedVenues();
  const saved = isSaved(venueId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(venueId);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this spot"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors ${
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
      } ${
        saved
          ? "bg-navy text-cream"
          : "border border-line bg-white text-navy hover:border-navy/40"
      }`}
    >
      <Bookmark
        size={size === "sm" ? 13 : 15}
        strokeWidth={2.25}
        fill={saved ? "currentColor" : "none"}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
