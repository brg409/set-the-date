import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Logo />
        <Link
          href="/saved"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-navy transition-colors hover:bg-sand"
        >
          <Bookmark size={16} strokeWidth={2.25} />
          <span className="hidden sm:inline">Saved</span>
        </Link>
      </div>
    </header>
  );
}
