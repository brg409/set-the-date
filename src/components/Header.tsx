"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { TABS } from "./tabs";

/**
 * Top bar on every screen. On phones it's just the logo (navigation is the
 * fixed bottom tab bar); from `md` up the same four tabs appear inline here
 * and the bottom bar is hidden.
 */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-page/90 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {TABS.map((tab) => {
            const active = tab.isActive(pathname);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-tint text-primary"
                    : "text-ink/70 hover:bg-tint hover:text-ink"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
