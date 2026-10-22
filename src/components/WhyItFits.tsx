import { Sparkles } from "lucide-react";

/**
 * `heading` defaults to the search-context wording. Callers with no active
 * search (e.g. a place opened from My Places) pass "About this place" so the
 * UI never claims a place was picked for a search that didn't happen.
 */
export function WhyItFits({
  text,
  heading = "Why we picked it for you",
  compact = false,
}: {
  text: string;
  heading?: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-tint ${compact ? "p-3.5" : "p-4"}`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Sparkles size={13} strokeWidth={2.5} />
        {heading}
      </div>
      <p className="text-sm leading-relaxed text-ink">{text}</p>
    </div>
  );
}
