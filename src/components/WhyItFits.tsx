import { Sparkles } from "lucide-react";

export function WhyItFits({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-gold/30 bg-gold/10 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-coral-dark">
        <Sparkles size={13} strokeWidth={2.5} />
        Why it fits
      </div>
      <p className="text-sm leading-relaxed text-ink">{text}</p>
    </div>
  );
}
