import Link from "next/link";
import { CalendarHeart } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 group ${className}`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-cream">
        <CalendarHeart size={16} strokeWidth={2.25} />
      </span>
      <span className="font-display text-lg tracking-tight text-navy">
        Know a Place
      </span>
    </Link>
  );
}
