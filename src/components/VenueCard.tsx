import Link from "next/link";
import { ArrowRight, ExternalLink, MapPinOff, DollarSign, TreePine, Utensils } from "lucide-react";
import type { DatePreferences, NotForMeReason, ScoredVenue } from "@/lib/types";
import { PRICE_LABEL, findOption, NEIGHBORHOOD_OPTIONS } from "@/lib/options";
import { RESULTS_COPY } from "@/lib/copy";
import { VenuePhoto } from "./VenuePhoto";
import { WhyItFits } from "./WhyItFits";
import { Chip } from "./Chip";
import { SaveButton } from "./SaveButton";
import { BeenHereButton } from "./BeenHereButton";
import { NotForMeControl } from "./NotForMeControl";

export function VenueCard({
  scored,
  rank,
  detailHref,
  prefs,
  fromSearch,
  whyHeading,
  onNotForMe,
}: {
  scored: ScoredVenue;
  rank?: number;
  /** The place's own page; the photo, the name, and "View details" all lead there. */
  detailHref: string;
  /** When provided, shows why a result is outside the user's exact filters. */
  prefs?: DatePreferences;
  /** The search (URL params) this card was shown for. */
  fromSearch?: string;
  /** Overrides the "Why we picked it for you" heading when there is no search context. */
  whyHeading?: string;
  /** When provided, shows the "Not for me" action (results context only). */
  onNotForMe?: (venueId: string, reason: NotForMeReason | null) => void;
}) {
  const { venue, whyItFits } = scored;
  const neighborhood = findOption(NEIGHBORHOOD_OPTIONS, venue.neighborhood);

  // "Reserve" only where a verified reservation link is on file. Everything
  // else with a website gets an honestly-labeled "Website" link instead.
  const reservationUrl = venue.reservationUrl;
  const websiteUrl = venue.websiteUrl;

  const outsideNeighborhood = prefs && venue.neighborhood !== prefs.neighborhood;
  const outsideBudget = prefs && venue.priceLevel > prefs.budget;
  const wantedIO = prefs?.filters?.indoorOutdoor;
  const outsideIndoorOutdoor =
    wantedIO &&
    !(wantedIO === "indoor" ? venue.hasIndoorSeating : venue.outdoorSeating === "yes");
  const wantedFood = prefs?.filters?.food;
  const outsideFood = wantedFood && !venue.foodDrinkActivity.includes(wantedFood);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sm shadow-ink/[0.04]">
      <Link
        href={detailHref}
        aria-label={`View details for ${venue.name}`}
        className="relative block aspect-[16/10] w-full overflow-hidden text-left"
      >
        {/*
          `aspect-ratio` alone only sets a *preferred* size — a normal-flow
          child taller than that ratio (e.g. a portrait-oriented source
          photo) still forces the box to grow to fit it. Wrapping the photo
          in its own `absolute inset-0` layer takes it out of flow entirely,
          so its content can never influence this button's size regardless
          of the source image's natural dimensions.
        */}
        <div className="absolute inset-0">
          <VenuePhoto venue={venue} preferOutdoor={wantedIO === "outdoor"} linkAttribution={false} />
        </div>
        {rank && (
          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/95 text-sm font-semibold text-ink shadow-sm">
            {rank}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
          {PRICE_LABEL[venue.priceLevel]}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
        {(outsideNeighborhood || outsideBudget || outsideIndoorOutdoor || outsideFood) && (
          <div className="flex flex-wrap gap-1.5">
            {outsideNeighborhood && (
              <Chip icon={MapPinOff} tone="accent">
                Outside {findOption(NEIGHBORHOOD_OPTIONS, prefs!.neighborhood).label}
              </Chip>
            )}
            {outsideBudget && (
              <Chip icon={DollarSign} tone="accent">
                Above your {PRICE_LABEL[prefs!.budget]} budget
              </Chip>
            )}
            {outsideIndoorOutdoor && (
              <Chip icon={TreePine} tone="accent">
                No verified {wantedIO} seating
              </Chip>
            )}
            {outsideFood && (
              <Chip icon={Utensils} tone="accent">
                Not tagged as {wantedFood}
              </Chip>
            )}
          </div>
        )}

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

        <WhyItFits text={whyItFits} heading={whyHeading ?? RESULTS_COPY.whyItFitsLabel} compact />

        {/* Same two-row structure on every card so the three line up: Save and
            Been Here side by side, then one full-width link. */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <SaveButton venueId={venue.id} fromSearch={fromSearch} size="sm" fullWidth />
          <BeenHereButton venueId={venue.id} fromSearch={fromSearch} size="sm" fullWidth />
          {reservationUrl ? (
            <a
              href={reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              <ExternalLink size={15} strokeWidth={2.25} />
              Reserve a Table
            </a>
          ) : (
            websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:bg-tint"
              >
                <ExternalLink size={15} strokeWidth={2.25} />
                Visit Website
              </a>
            )
          )}
        </div>

        <div className="-mb-1 flex flex-wrap items-center justify-between gap-x-2">
          <Link
            href={detailHref}
            className="inline-flex min-h-9 items-center gap-1 rounded-full px-1 text-sm font-medium text-primary hover:text-primary-dark"
          >
            View details
            <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
          </Link>
          {onNotForMe && <NotForMeControl onDismiss={(reason) => onNotForMe(venue.id, reason)} />}
        </div>
      </div>
    </article>
  );
}
