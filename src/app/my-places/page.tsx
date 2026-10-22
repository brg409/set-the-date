"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle2, Heart } from "lucide-react";
import { SavedPlaceCard } from "@/components/SavedPlaceCard";
import { EmptyState } from "@/components/EmptyState";
import { getButtonClasses } from "@/components/Button";
import { useMyPlaces } from "@/hooks/useMyPlaces";
import { getVenueById } from "@/data/venues";
import { generateConciseWhyItFits } from "@/lib/recommend";
import { paramsToPreferences } from "@/lib/queryParams";
import { placeHref } from "@/lib/placeLinks";
import { MY_PLACES_COPY } from "@/lib/copy";
import type { PlaceEntry } from "@/lib/myPlaces";

type Section = "want" | "been" | "favorites";

const SECTIONS: { key: Section; label: string; icon: typeof Bookmark; empty: string }[] = [
  {
    key: "want",
    label: "Want to Go",
    icon: Bookmark,
    empty: "Tap Save on any place and it will show up here.",
  },
  {
    key: "been",
    label: "Been There",
    icon: CheckCircle2,
    empty: "Mark a place Been Here and it will show up here, where you can rate it and add a note.",
  },
  {
    key: "favorites",
    label: "Favorites",
    icon: Heart,
    empty: "Tap Favorite on a place and it will show up here.",
  },
];

function inSection(entry: PlaceEntry, section: Section): boolean {
  if (section === "want") return entry.wantToGo;
  if (section === "been") return entry.visited;
  return entry.favorite;
}

export default function MyPlacesPage() {
  const { entries } = useMyPlaces();
  const [section, setSection] = useState<Section>("want");

  const counts = useMemo(() => {
    const all = Object.values(entries).filter((e) => getVenueById(e.venueId));
    return {
      want: all.filter((e) => e.wantToGo).length,
      been: all.filter((e) => e.visited).length,
      favorites: all.filter((e) => e.favorite).length,
    };
  }, [entries]);

  const items = useMemo(() => {
    return Object.values(entries)
      .filter((entry) => inSection(entry, section))
      .sort((a, b) => {
        const at = (section === "been" ? a.visitedAt : a.savedAt) ?? a.visitedAt ?? a.savedAt ?? "";
        const bt = (section === "been" ? b.visitedAt : b.savedAt) ?? b.visitedAt ?? b.savedAt ?? "";
        return bt.localeCompare(at);
      })
      .map((entry) => {
        const venue = getVenueById(entry.venueId);
        if (!venue) return null;
        // Saved from a search: that search's explanation. Saved without one:
        // there is nothing to personalise, so the venue's own description.
        const prefs = entry.fromSearch
          ? paramsToPreferences(new URLSearchParams(entry.fromSearch))
          : null;
        return {
          venue,
          text: prefs ? generateConciseWhyItFits(venue, prefs) : venue.description,
          hasSearchContext: Boolean(prefs),
          fromSearch: prefs ? entry.fromSearch : undefined,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [entries, section]);

  const active = SECTIONS.find((s) => s.key === section)!;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-8 pt-6 sm:pt-8">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{MY_PLACES_COPY.heading}</h1>
      <p className="mt-1 text-sm text-muted">{MY_PLACES_COPY.subheading}</p>

      <div
        role="tablist"
        aria-label="My Places sections"
        className="mt-5 inline-flex w-full rounded-full bg-tint p-1 sm:w-auto"
      >
        {SECTIONS.map((s) => {
          const isActive = s.key === section;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSection(s.key)}
              className={`flex min-h-10 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full px-1.5 text-[13px] font-medium transition-colors sm:flex-none sm:gap-1.5 sm:px-4 sm:text-sm ${
                isActive ? "bg-card text-primary shadow-sm" : "text-ink/70 hover:text-ink"
              }`}
            >
              {s.label}
              <span className="text-xs text-muted">{counts[s.key]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={active.icon}
            title={`Nothing in ${active.label} yet`}
            body={active.empty}
            action={
              <Link href="/find" className={getButtonClasses("primary", "md")}>
                Find a place
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ venue, text, hasSearchContext, fromSearch }) => (
              <SavedPlaceCard
                key={venue.id}
                venue={venue}
                text={text}
                hasSearchContext={hasSearchContext}
                fromSearch={fromSearch}
                detailHref={placeHref(venue.id, { search: fromSearch, from: "my-places" })}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Your places, ratings, and notes are kept on this device, in this browser.
      </p>
    </main>
  );
}
