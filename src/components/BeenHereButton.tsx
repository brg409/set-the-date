"use client";

import { CheckCircle2 } from "lucide-react";
import { useMyPlaces } from "@/hooks/useMyPlaces";

/** Mark / unmark a place as visited ("Been There" in My Places). */
export function BeenHereButton({
  venueId,
  fromSearch,
  size = "md",
}: {
  venueId: string;
  fromSearch?: string;
  size?: "sm" | "md";
}) {
  const { isVisited, toggleVisited } = useMyPlaces();
  const visited = isVisited(venueId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleVisited(venueId, fromSearch);
      }}
      aria-pressed={visited}
      aria-label={visited ? "Remove from Been There" : "Mark as been here"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors ${
        size === "sm" ? "min-h-10 px-3.5 py-2 text-sm" : "min-h-11 px-4 py-2.5 text-sm"
      } ${
        visited
          ? "bg-tint-strong text-primary-dark hover:bg-lavender/60"
          : "border border-line bg-card text-ink hover:border-primary/40 hover:bg-tint"
      }`}
    >
      <CheckCircle2 size={size === "sm" ? 15 : 16} strokeWidth={2.25} />
      Been Here
    </button>
  );
}
