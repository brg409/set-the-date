import Link from "next/link";
import { MapPinned } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 group ${className}`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-cream">
        <MapPinned size={16} strokeWidth={2.25} />
      </span>
      <span className="font-display text-lg tracking-tight text-navy">
        Set the Date
      </span>
    </Link>
  );
}
