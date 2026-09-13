import { MapPin, ExternalLink, Navigation } from "lucide-react";
import type { ScoredVenue } from "@/lib/types";
import { PRICE_LABEL, findOption, NEIGHBORHOOD_OPTIONS } from "@/lib/options";
import { getKeyAttributeChips } from "@/lib/attributeLabels";
import { getDirectionsUrl, getReserveUrl } from "@/lib/externalLinks";
import { VenuePhoto } from "./VenuePhoto";
import { WhyItFits } from "./WhyItFits";
import { Chip } from "./Chip";
import { Button } from "./Button";
import { SaveButton } from "./SaveButton";

export function VenueCard({
  scored,
  rank,
  onViewDetails,
}: {
  scored: ScoredVenue;
  rank?: number;
  onViewDetails: (venueId: string) => void;
}) {
  const { venue, whyItFits } = scored;
  const neighborhood = findOption(NEIGHBORHOOD_OPTIONS, venue.neighborhood);
  const chips = getKeyAttributeChips(venue);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm shadow-navy/[0.03] transition-shadow hover:shadow-md hover:shadow-navy/[0.06]">
      <button
        type="button"
        onClick={() => onViewDetails(venue.id)}
        className="relative block aspect-[16/10] w-full text-left"
      >
        <VenuePhoto venue={venue} />
        {rank && (
          <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-navy shadow-sm">
            {rank}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-navy shadow-sm">
          {PRICE_LABEL[venue.priceLevel]}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy/60">
            <span>{venue.categoryLabel}</span>
            <span aria-hidden>&middot;</span>
            <span>{neighborhood.label}</span>
          </div>
          <button
            type="button"
            onClick={() => onViewDetails(venue.id)}
            className="text-left font-display text-xl text-navy hover:text-coral-dark"
          >
            {venue.name}
          </button>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/75">
            {venue.description}
          </p>
        </div>

        <WhyItFits text={whyItFits} compact />

        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Chip key={chip.label} icon={chip.icon}>
              {chip.label}
            </Chip>
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-ink/60">
          <MapPin size={13} strokeWidth={2.25} />
          {venue.address}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" onClick={() => onViewDetails(venue.id)}>
            View details
          </Button>
          <SaveButton venueId={venue.id} size="sm" />
          <a
            href={getReserveUrl(venue)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:border-navy/40"
          >
            <ExternalLink size={13} strokeWidth={2.25} />
            Reserve
          </a>
          <a
            href={getDirectionsUrl(venue)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:border-navy/40"
          >
            <Navigation size={13} strokeWidth={2.25} />
            Directions
          </a>
        </div>
      </div>
    </article>
  );
}
