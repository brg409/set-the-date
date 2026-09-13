import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Chip({
  icon: Icon,
  children,
  tone = "default",
}: {
  icon?: LucideIcon;
  children: ReactNode;
  tone?: "default" | "navy" | "coral";
}) {
  const toneClasses = {
    default: "bg-sand text-navy",
    navy: "bg-navy text-cream",
    coral: "bg-coral/10 text-coral-dark",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${toneClasses}`}
    >
      {Icon && <Icon size={13} strokeWidth={2.25} />}
      {children}
    </span>
  );
}
