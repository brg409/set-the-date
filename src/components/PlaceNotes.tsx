"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useMyPlaces } from "@/hooks/useMyPlaces";
import { setRating, setReview } from "@/lib/myPlaces";

const MAX_NOTE = 500;

/**
 * "Your visit": the person's own 1-5 rating and short note for a place they've
 * been to. Stored on this device with the rest of My Places; never shown to
 * anyone else and never averaged into anything.
 */
export function PlaceNotes({ venueId }: { venueId: string }) {
  const { getEntry } = useMyPlaces();
  const entry = getEntry(venueId);
  const rating = entry?.rating;
  const [draft, setDraft] = useState(entry?.review ?? "");
  const [savedNote, setSavedNote] = useState(false);

  function commitNote() {
    if (draft.trim() === (entry?.review ?? "")) return;
    setReview(venueId, draft);
    setSavedNote(true);
  }

  return (
    <section
      aria-label="Your visit"
      className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4"
    >
      <div>
        <h3 className="text-sm font-semibold text-ink">Your rating</h3>
        <div role="radiogroup" aria-label="Your rating out of 5" className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = rating !== undefined && n <= rating;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                // Choosing the rating you already have clears it.
                onClick={() => setRating(venueId, rating === n ? undefined : n)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-tint"
              >
                <Star size={22} strokeWidth={2} fill={on ? "currentColor" : "none"} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor={`note-${venueId}`} className="text-sm font-semibold text-ink">
          Your note <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`note-${venueId}`}
          value={draft}
          maxLength={MAX_NOTE}
          rows={3}
          placeholder="What did you order? Would you go back?"
          onChange={(e) => {
            setDraft(e.target.value);
            setSavedNote(false);
          }}
          onBlur={commitNote}
          className="mt-1 w-full resize-y rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary"
        />
        <p className="mt-1 text-xs text-muted" aria-live="polite">
          {savedNote ? "Saved on this device." : `${draft.length}/${MAX_NOTE}`}
        </p>
      </div>
    </section>
  );
}
