"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, MapPin, Navigation } from "lucide-react";
import type { Venue } from "@/lib/types";
import { PRICE_LABEL, findOption, NEIGHBORHOOD_OPTIONS } from "@/lib/options";
import { getFullAttributeList } from "@/lib/attributeLabels";
import { getDirectionsUrl } from "@/lib/externalLinks";
import { generateWhyItFits } from "@/lib/recommend";
import { backTarget, parsePlaceContext } from "@/lib/placeLinks";
import { VenuePhotoGallery } from "./VenuePhotoGallery";
import { WhyItFits } from "./WhyItFits";
import { Chip } from "./Chip";
import { getButtonClasses } from "./Button";
import { SaveButton } from "./SaveButton";
import { BeenHereButton } from "./BeenHereButton";
import { FavoriteButton } from "./FavoriteButton";
import { PlaceNotes } from "./PlaceNotes";
import { useMyPlaces } from "@/hooks/useMyPlaces";
import { trackPlaceViewed } from "@/lib/analytics";
import { trackLinkProps } from "@/lib/trackLink";

/**
 * A place's own page. Everything shown comes from the venue's record. When the
 * visitor arrived from a search, the full "Why we picked it for you" text is
 * generated for that search; with no search there is no personalised text, so
 * the page just says "About this place" and shows the venue's own description.
 */
export function PlaceDetail({ venue }: { venue: Venue }) {
  const searchParams = useSearchParams();
  const ctx = useMemo(() => parsePlaceContext(searchParams), [searchParams]);
  const back = backTarget(ctx);
  const neighborhood = findOption(NEIGHBORHOOD_OPTIONS, venue.neighborhood);
  const attributes = getFullAttributeList(venue);
  const fromSearch = ctx.prefs ? ctx.search : undefined;
  const { isVisited } = useMyPlaces();

  const { reservationUrl, websiteUrl } = venue;

  const source = ctx.origin ?? (ctx.prefs ? "search" : "direct");
  useEffect(() => {
    trackPlaceViewed(venue.id, source);
  }, [venue.id, source]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-10 pt-4 sm:pt-6">
      <Link
        href={back.href}
        className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-primary hover:text-primary-dark"
      >
        <ArrowLeft size={16} strokeWidth={2.25} aria-hidden />
        {back.label}
      </Link>

      <div className="mt-2 overflow-hidden rounded-3xl border border-line bg-card">
        <VenuePhotoGallery venue={venue} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <header>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wide text-muted">
            <span>{venue.categoryLabel}</span>
            <span aria-hidden>&middot;</span>
            <span>{neighborhood.label}</span>
            <span aria-hidden>&middot;</span>
            <span>{PRICE_LABEL[venue.priceLevel]}</span>
          </div>
          <h1 className="mt-1.5 font-display text-3xl leading-tight text-ink sm:text-4xl">
            {venue.name}
          </h1>
          {ctx.prefs && (
            <p className="mt-2 text-base leading-relaxed text-ink/75">{venue.description}</p>
          )}
        </header>

        {/* The primary actions come first: book or visit, then directions. */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {reservationUrl && (
              <a
                href={reservationUrl}
                target="_blank"
                rel="noopener noreferrer"
                {...trackLinkProps("reserve_click", venue.id, "place")}
                className={`${getButtonClasses("primary", "lg")} sm:flex-1`}
              >
                <ExternalLink size={16} strokeWidth={2.25} aria-hidden />
                Reserve a Table
              </a>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                {...trackLinkProps("website_click", venue.id, "place")}
                className={`${getButtonClasses(reservationUrl ? "outline" : "primary", "lg")} sm:flex-1`}
              >
                <ExternalLink size={16} strokeWidth={2.25} aria-hidden />
                Visit Website
              </a>
            )}
            <a
              href={getDirectionsUrl(venue)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${getButtonClasses("outline", "lg")} sm:flex-1`}
            >
              <Navigation size={16} strokeWidth={2.25} aria-hidden />
              Directions
            </a>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SaveButton venueId={venue.id} fromSearch={fromSearch} fullWidth />
            <BeenHereButton venueId={venue.id} fromSearch={fromSearch} fullWidth />
            <FavoriteButton venueId={venue.id} fullWidth />
          </div>
        </div>

        {isVisited(venue.id) && <PlaceNotes venueId={venue.id} />}

        {ctx.prefs ? (
          <WhyItFits text={generateWhyItFits(venue, ctx.prefs)} />
        ) : (
          <WhyItFits text={venue.description} heading="About this place" />
        )}

        <section aria-labelledby="stands-out">
          <h2 id="stands-out" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            What stands out
          </h2>
          <ul className="flex flex-col gap-2">
            {venue.tags.map((tag) => (
              <li key={tag} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
                <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="good-to-know">
          <h2 id="good-to-know" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Good to know
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {attributes.map((attr) => (
              <Chip key={attr.label} icon={attr.icon}>
                {attr.label}
              </Chip>
            ))}
          </div>
        </section>

        <div className="grid gap-4 rounded-2xl bg-tint p-4 text-sm sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Estimated cost
            </h2>
            <p className="mt-1 text-ink">
              {PRICE_LABEL[venue.priceLevel]} &middot; ${venue.pricePerPerson[0]}&ndash;$
              {venue.pricePerPerson[1]} / person
            </p>
          </div>
          <div>
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <MapPin size={13} strokeWidth={2.5} aria-hidden />
              Address
            </h2>
            <p className="mt-1 text-ink">{venue.address}</p>
          </div>
        </div>

        <p className="text-xs text-muted">
          Details, hours, and availability can change &mdash; confirm on the venue&rsquo;s own site
          before you go.
        </p>
      </div>
    </main>
  );
}
