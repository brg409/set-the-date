import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VenuePhoto } from "@/components/VenuePhoto";
import { findOption, NEIGHBORHOOD_OPTIONS, PRICE_LABEL } from "@/lib/options";
import {
  FEATURED_BLURBS,
  FEATURED_VENUE_IDS,
  HOME_COPY,
  venuesFromIds,
} from "@/lib/homeContent";
import { placeHref } from "@/lib/placeLinks";
import type { Venue } from "@/lib/types";

function FeaturedCard({ venue }: { venue: Venue }) {
  const neighborhood = findOption(NEIGHBORHOOD_OPTIONS, venue.neighborhood).label;

  return (
    <Link
      href={placeHref(venue.id, { from: "home" })}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-tint-strong">
        <div className="absolute inset-0">
          <VenuePhoto venue={venue} sizePx={800} linkAttribution={false} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {venue.categoryLabel} &middot; {neighborhood} &middot; {PRICE_LABEL[venue.priceLevel]}
        </p>
        <h3 className="font-display text-xl text-ink">{venue.name}</h3>
        <p className="text-sm leading-relaxed text-ink/75">
          {FEATURED_BLURBS[venue.id] ?? venue.description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-primary">
          View details
          <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function FeaturedPlaces() {
  const venues = venuesFromIds(FEATURED_VENUE_IDS);

  return (
    <section aria-labelledby="featured" className="mx-auto w-full max-w-5xl px-5 py-10 md:py-14">
      <h2 id="featured" className="font-display text-2xl text-ink sm:text-3xl">
        {HOME_COPY.featuredHeading}
      </h2>
      <p className="mt-1 text-sm text-muted">{HOME_COPY.featuredSub}</p>
      <ul className="mt-5 grid gap-4 md:grid-cols-3">
        {venues.map((venue) => (
          <li key={venue.id}>
            <FeaturedCard venue={venue} />
          </li>
        ))}
      </ul>
    </section>
  );
}
