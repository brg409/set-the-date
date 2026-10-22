"use client";

import { Heart } from "lucide-react";
import { useMyPlaces } from "@/hooks/useMyPlaces";

/** Mark / unmark a place as a favorite ("Favorites" in My Places). */
export function FavoriteButton({
  venueId,
  size = "md",
  fullWidth = false,
  iconOnly = false,
}: {
  venueId: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  /** Just the heart, for tight rows; the accessible name is unchanged. */
  iconOnly?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useMyPlaces();
  const favorite = isFavorite(venueId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(venueId);
      }}
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from Favorites" : "Add to Favorites"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors ${
        iconOnly
          ? "min-h-11 min-w-11 px-3 py-2 text-sm"
          : size === "sm"
            ? "min-h-11 px-3 py-2 text-sm"
            : "min-h-11 px-4 py-2.5 text-sm"
      } ${fullWidth ? "w-full" : ""} ${
        favorite
          ? iconOnly
            ? "bg-accent text-primary-dark hover:bg-accent/90"
            : "bg-accent/40 text-primary-dark hover:bg-accent/60"
          : "border border-line bg-card text-ink hover:border-primary/40 hover:bg-tint"
      }`}
    >
      <Heart
        size={size === "sm" ? 15 : 16}
        strokeWidth={2.25}
        fill={favorite ? "currentColor" : "none"}
      />
      {!iconOnly && "Favorite"}
    </button>
  );
}
