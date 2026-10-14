import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Chip({
  icon: Icon,
  children,
  tone = "default",
}: {
  icon?: LucideIcon;
  children: ReactNode;
  tone?: "default" | "primary" | "accent";
}) {
  const toneClasses = {
    default: "bg-tint text-ink",
    primary: "bg-primary text-white",
    accent: "bg-accent/40 text-ink",
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
