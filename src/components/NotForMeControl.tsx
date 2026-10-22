"use client";

import { useState } from "react";
import { ThumbsDown, X } from "lucide-react";
import { NOT_FOR_ME_REASONS, type NotForMeReason } from "@/lib/types";
import { NOT_FOR_ME_REASON_LABELS } from "@/lib/options";

/**
 * "Not for me" starts as a subtle text action. Clicking it expands an
 * inline, optional reason picker in place (no popover positioning to get
 * wrong on mobile). Picking a reason — or dismissing without one — both
 * call `onDismiss`, since the reason itself is optional context, not a
 * gate on removing the card.
 */
export function NotForMeControl({
  onDismiss,
}: {
  onDismiss: (reason: NotForMeReason | null) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-tint hover:text-ink"
      >
        <ThumbsDown size={13} strokeWidth={2.25} />
        Not for me
      </button>
    );
  }

  return (
    <div className="mt-1 flex w-full flex-col gap-2 rounded-2xl bg-tint p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink/70">Why not? (optional)</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cancel"
          className="text-muted hover:text-ink"
        >
          <X size={14} strokeWidth={2.25} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {NOT_FOR_ME_REASONS.map((reason) => (
          <button
            key={reason}
            type="button"
            onClick={() => onDismiss(reason)}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40"
          >
            {NOT_FOR_ME_REASON_LABELS[reason]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onDismiss(null)}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
        >
          Skip, just remove it
        </button>
      </div>
    </div>
  );
}
