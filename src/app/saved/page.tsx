"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { VenueCard } from "@/components/VenueCard";
import { VenueDetailModal } from "@/components/VenueDetailModal";
import { EmptyState } from "@/components/EmptyState";
import { useSavedVenues } from "@/hooks/useSavedVenues";
import { getVenueById } from "@/data/venues";
import { getDefaultWhyItFits } from "@/lib/recommend";
import { SAVED_COPY } from "@/lib/copy";
import type { ScoredVenue } from "@/lib/types";

export default function SavedPage() {
  const { savedIds } = useSavedVenues();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const savedVenues: ScoredVenue[] = savedIds
    .map(getVenueById)
    .filter((v): v is NonNullable<typeof v> => Boolean(v))
    .map((venue) => ({
      venue,
      score: 0,
      whyItFits: getDefaultWhyItFits(venue),
      matchedTags: venue.tags.slice(0, 3),
    }));

  const selected = savedVenues.find((r) => r.venue.id === selectedId) ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="font-display text-2xl text-navy sm:text-3xl">
            {SAVED_COPY.heading}
          </h1>
          <p className="text-sm text-ink/60">{SAVED_COPY.subheading}</p>
        </div>

        {savedVenues.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={SAVED_COPY.emptyTitle}
            body={SAVED_COPY.emptyBody}
            action={
              <Link href="/plan">
                <Button>{SAVED_COPY.emptyCta}</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedVenues.map((scored) => (
              <VenueCard
                key={scored.venue.id}
                scored={scored}
                onViewDetails={setSelectedId}
              />
            ))}
          </div>
        )}
      </main>

      {selected && (
        <VenueDetailModal
          venue={selected.venue}
          whyItFits={selected.whyItFits}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
