"use client";

import { Bookmark } from "lucide-react";
import { useMyPlaces } from "@/hooks/useMyPlaces";
import { restoreWantToGo } from "@/lib/myPlaces";
import { getVenueById } from "@/data/venues";
import { showToast } from "@/lib/toast";

/** Save / unsave to "Want to Go" in My Places. */
export function SaveButton({
  venueId,
  fromSearch,
  size = "md",
  fullWidth = false,
}: {
  venueId: string;
  /** The search (URL params) the venue was shown for, kept so its "why" context survives. */
  fromSearch?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
}) {
  const { isSaved, toggleSaved, getEntry } = useMyPlaces();
  const saved = isSaved(venueId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const before = getEntry(venueId);
        toggleSaved(venueId, fromSearch);
        // Removing a saved place is easy to do by accident, so offer Undo.
        if (before?.wantToGo) {
          const name = getVenueById(venueId)?.name;
          showToast(name ? `Removed ${name} from Want to Go` : "Removed from Want to Go", {
            label: "Undo",
            run: () => restoreWantToGo(venueId, { savedAt: before.savedAt, fromSearch: before.fromSearch }),
          });
        }
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from Want to Go" : "Save to Want to Go"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors ${
        size === "sm" ? "min-h-11 px-3.5 py-2 text-sm" : "min-h-11 px-4 py-2.5 text-sm"
      } ${fullWidth ? "w-full" : ""} ${
        saved
          ? "bg-primary text-white hover:bg-primary-dark"
          : "border border-line bg-card text-ink hover:border-primary/40 hover:bg-tint"
      }`}
    >
      <Bookmark
        size={size === "sm" ? 15 : 16}
        strokeWidth={2.25}
        fill={saved ? "currentColor" : "none"}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
