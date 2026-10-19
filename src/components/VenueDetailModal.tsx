"use client";

import { useEffect } from "react";
import { X, MapPin, ExternalLink, Navigation, DollarSign } from "lucide-react";
import type { Venue } from "@/lib/types";
import { PRICE_LABEL, findOption, NEIGHBORHOOD_OPTIONS } from "@/lib/options";
import { getFullAttributeList } from "@/lib/attributeLabels";
import { getDirectionsUrl } from "@/lib/externalLinks";
import { VenuePhotoGallery } from "./VenuePhotoGallery";
import { WhyItFits } from "./WhyItFits";
import { Chip } from "./Chip";
import { LinkButton } from "./Button";
import { SaveButton } from "./SaveButton";
import { BeenHereButton } from "./BeenHereButton";

export function VenueDetailModal({
  venue,
  whyItFits,
  fromSearch,
  onClose,
}: {
  venue: Venue;
  whyItFits: string;
  /** Present when opened from a search; absent means "About this place" wording. */
  fromSearch?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const neighborhood = findOption(NEIGHBORHOOD_OPTIONS, venue.neighborhood);
  const attributes = getFullAttributeList(venue);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={venue.name}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card/95 text-ink shadow-sm transition-colors hover:bg-card"
        >
          <X size={18} strokeWidth={2.25} />
        </button>

        <VenuePhotoGallery venue={venue} />

        <div className="flex flex-col gap-5 p-6">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              <span>{venue.categoryLabel}</span>
              <span aria-hidden>&middot;</span>
              <span>{neighborhood.label}</span>
            </div>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">{venue.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{venue.description}</p>
          </div>

          <WhyItFits
            text={whyItFits}
            heading={fromSearch ? undefined : "About this place"}
          />

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Good to know
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {attributes.map((attr) => (
                <Chip key={attr.label} icon={attr.icon}>
                  {attr.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-tint p-4 text-sm">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <DollarSign size={13} strokeWidth={2.5} />
                Estimated cost
              </div>
              <p className="mt-1 text-ink">
                {PRICE_LABEL[venue.priceLevel]} &middot; ${venue.pricePerPerson[0]}
                &ndash;${venue.pricePerPerson[1]} / person
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <MapPin size={13} strokeWidth={2.5} />
                Address
              </div>
              <p className="mt-1 text-ink">{venue.address}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
            <SaveButton venueId={venue.id} fromSearch={fromSearch} />
            <BeenHereButton venueId={venue.id} fromSearch={fromSearch} />
            {venue.reservationUrl && (
              <LinkButton href={venue.reservationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={15} strokeWidth={2.25} />
                Reserve a Table
              </LinkButton>
            )}
            {!venue.reservationUrl && venue.websiteUrl && (
              <LinkButton
                href={venue.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
              >
                <ExternalLink size={15} strokeWidth={2.25} />
                Visit Website
              </LinkButton>
            )}
            <LinkButton
              href={getDirectionsUrl(venue)}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
            >
              <Navigation size={15} strokeWidth={2.25} />
              Directions
            </LinkButton>
          </div>

          <p className="-mt-2 text-xs text-muted">
            Details, hours, and availability can change — confirm on the
            venue&rsquo;s own site before you go.
            {venue.verificationNotes && ` ${venue.verificationNotes}`}
          </p>
        </div>
      </div>
    </div>
  );
}
