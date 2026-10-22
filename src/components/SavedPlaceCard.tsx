"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { Venue } from "@/lib/types";
import { PRICE_LABEL, findOption, NEIGHBORHOOD_OPTIONS } from "@/lib/options";
import { VenuePhoto } from "./VenuePhoto";
import { WhyItFits } from "./WhyItFits";
import { SaveButton } from "./SaveButton";
import { BeenHereButton } from "./BeenHereButton";
import { FavoriteButton } from "./FavoriteButton";
import { PlaceNotes } from "./PlaceNotes";
import { trackLinkProps } from "@/lib/trackLink";
import { useMyPlaces } from "@/hooks/useMyPlaces";

/**
 * A place in My Places. If it was saved from a search, the text is that
 * search's explanation ("Why we picked it for you"); if not, there is no
 * search to personalise for, so it shows the venue's own description under
 * "About this place". Places you've been to also show your rating and note.
 */
export function SavedPlaceCard({
  venue,
  text,
  hasSearchContext,
  detailHref,
  fromSearch,
}: {
  venue: Venue;
  text: string;
  hasSearchContext: boolean;
  detailHref: string;
  fromSearch?: string;
}) {
  const { isVisited } = useMyPlaces();
  const neighborhood = findOption(NEIGHBORHOOD_OPTIONS, venue.neighborhood);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sm shadow-ink/[0.04]">
      <div className="relative">
        <Link
          href={detailHref}
          aria-label={`View details for ${venue.name}`}
          className="relative block aspect-[16/10] w-full overflow-hidden"
        >
          <div className="absolute inset-0">
            <VenuePhoto venue={venue} linkAttribution={false} />
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
            {PRICE_LABEL[venue.priceLevel]}
          </span>
        </Link>
        {/* Beside the link, not inside it: a button can't live inside an <a>. */}
        <div className="absolute left-3 top-3 rounded-full shadow-sm">
          <FavoriteButton venueId={venue.id} size="sm" iconOnly />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
        <div>
          <Link
            href={detailHref}
            className="font-display text-xl leading-snug text-ink hover:text-primary"
          >
            {venue.name}
          </Link>
          <p className="mt-1 text-sm text-muted">
            {venue.categoryLabel} &middot; {neighborhood.label} &middot;{" "}
            {PRICE_LABEL[venue.priceLevel]}
          </p>
        </div>

        <WhyItFits
          text={text}
          heading={hasSearchContext ? undefined : "About this place"}
          compact
        />

        <div className="mt-auto flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <SaveButton venueId={venue.id} fromSearch={fromSearch} size="sm" fullWidth />
            <BeenHereButton venueId={venue.id} fromSearch={fromSearch} size="sm" fullWidth />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Link
              href={detailHref}
              className="inline-flex min-h-9 items-center gap-1 rounded-full px-1 text-sm font-medium text-primary hover:text-primary-dark"
            >
              View details
              <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
            </Link>
            {venue.reservationUrl ? (
              <a
                href={venue.reservationUrl}
                target="_blank"
                rel="noopener noreferrer"
                {...trackLinkProps("reserve_click", venue.id, "my-places")}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1 text-sm font-medium text-primary hover:text-primary-dark"
              >
                Reserve a Table
                <ExternalLink size={13} strokeWidth={2.25} aria-hidden />
              </a>
            ) : (
              venue.websiteUrl && (
                <a
                  href={venue.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...trackLinkProps("website_click", venue.id, "my-places")}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1 text-sm font-medium text-primary hover:text-primary-dark"
                >
                  Visit Website
                  <ExternalLink size={13} strokeWidth={2.25} aria-hidden />
                </a>
              )
            )}
          </div>
        </div>

        {isVisited(venue.id) && <PlaceNotes venueId={venue.id} />}
      </div>
    </article>
  );
}
