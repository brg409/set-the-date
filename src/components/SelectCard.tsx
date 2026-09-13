import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

export function SelectCard({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative flex w-full flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150 sm:p-5 ${
        selected
          ? "border-coral bg-coral/[0.06] ring-2 ring-coral"
          : "border-line bg-white hover:border-navy/30 hover:bg-sand/40"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          selected ? "bg-coral text-white" : "bg-sand text-navy"
        }`}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <span>
        <span className="block font-medium text-navy">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-ink/60">{description}</span>
        )}
      </span>
    </button>
  );
}
