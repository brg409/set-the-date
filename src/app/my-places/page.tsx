"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle2, Heart } from "lucide-react";
import { VenueCard } from "@/components/VenueCard";
import { VenueDetailModal } from "@/components/VenueDetailModal";
import { EmptyState } from "@/components/EmptyState";
import { getButtonClasses } from "@/components/Button";
import { useMyPlaces } from "@/hooks/useMyPlaces";
import { getVenueById } from "@/data/venues";
import {
  generateConciseWhyItFits,
  generateWhyItFits,
  getDefaultWhyItFits,
} from "@/lib/recommend";
import { paramsToPreferences } from "@/lib/queryParams";
import { MY_PLACES_COPY } from "@/lib/copy";
import type { PlaceEntry } from "@/lib/myPlaces";
import type { ScoredVenue } from "@/lib/types";

type Section = "want" | "been" | "favorites";

const SECTIONS: { key: Section; label: string; icon: typeof Bookmark; empty: string }[] = [
  {
    key: "want",
    label: "Want to Go",
    icon: Bookmark,
    empty: "Tap Save on any recommendation and it will show up here.",
  },
  {
    key: "been",
    label: "Been There",
    icon: CheckCircle2,
    empty: "Mark a place Been Here and it will show up here.",
  },
  {
    key: "favorites",
    label: "Favorites",
    icon: Heart,
    empty: "Places you mark as favorites will show up here.",
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const all = Object.values(entries);
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
        const at = a.visitedAt ?? a.savedAt ?? "";
        const bt = b.visitedAt ?? b.savedAt ?? "";
        return bt.localeCompare(at);
      })
      .map((entry) => {
        const venue = getVenueById(entry.venueId);
        if (!venue) return null;
        // Use the search the place was saved from when we have it; otherwise
        // there is no search context, so the card says "About this place".
        const prefs = entry.fromSearch
          ? paramsToPreferences(new URLSearchParams(entry.fromSearch))
          : null;
        const scored: ScoredVenue = {
          venue,
          score: 0,
          whyItFits: prefs ? generateConciseWhyItFits(venue, prefs) : getDefaultWhyItFits(venue, 55),
          matchedTags: venue.tags.slice(0, 3),
        };
        // Full-length text for the detail view; the card shows the short one.
        const fullWhy = prefs ? generateWhyItFits(venue, prefs) : getDefaultWhyItFits(venue);
        return { scored, fullWhy, hasContext: Boolean(prefs), fromSearch: entry.fromSearch };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [entries, section]);

  const selected = items.find((i) => i.scored.venue.id === selectedId) ?? null;
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
              className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors sm:flex-none ${
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
              <Link href="/" className={getButtonClasses("primary", "md")}>
                Find a place
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ scored, hasContext, fromSearch }) => (
              <VenueCard
                key={scored.venue.id}
                scored={scored}
                onViewDetails={setSelectedId}
                fromSearch={fromSearch}
                whyHeading={hasContext ? undefined : "About this place"}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <VenueDetailModal
          venue={selected.scored.venue}
          whyItFits={selected.fullWhy}
          fromSearch={selected.hasContext ? selected.fromSearch : undefined}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
