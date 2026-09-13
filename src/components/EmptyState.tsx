import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-navy">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <h3 className="font-display text-xl text-navy">{title}</h3>
      <p className="max-w-sm text-sm text-ink/65">{body}</p>
      {action}
    </div>
  );
}
