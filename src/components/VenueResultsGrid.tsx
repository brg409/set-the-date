"use client";

import { useState } from "react";
import type { ScoredVenue } from "@/lib/types";
import { VenueCard } from "./VenueCard";
import { VenueDetailModal } from "./VenueDetailModal";

export function VenueResultsGrid({ results }: { results: ScoredVenue[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = results.find((r) => r.venue.id === selectedId) ?? null;

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((scored, i) => (
          <VenueCard
            key={scored.venue.id}
            scored={scored}
            rank={i + 1}
            onViewDetails={setSelectedId}
          />
        ))}
      </div>

      {selected && (
        <VenueDetailModal
          venue={selected.venue}
          whyItFits={selected.whyItFits}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
