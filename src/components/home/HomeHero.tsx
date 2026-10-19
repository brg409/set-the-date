import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { VenuePhoto } from "@/components/VenuePhoto";
import { getButtonClasses } from "@/components/Button";
import { findOption, NEIGHBORHOOD_OPTIONS } from "@/lib/options";
import { HERO_VENUE_IDS, HOME_COPY, venuesFromIds } from "@/lib/homeContent";
import { VENUES } from "@/data/venues";

/**
 * Headline and CTA beside a three-photo collage on desktop; on phones the
 * photos come first and the text follows. Every photo is a real Google Places
 * photo of a venue in our database, with Google's credit shown on it.
 */
export function HomeHero() {
  const venues = venuesFromIds(HERO_VENUE_IDS);

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 px-5 pb-10 pt-4 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-10 md:pb-16 md:pt-10">
      <div className="grid grid-cols-2 gap-2 md:col-start-2 md:row-start-1 md:h-[27rem] md:grid-cols-[1.15fr_1fr] md:grid-rows-2 md:gap-3">
        {venues.map((venue, i) => (
          <div
            key={venue.id}
            className={`relative overflow-hidden rounded-2xl bg-tint-strong md:aspect-auto ${
              i === 0
                ? "col-span-2 aspect-[16/9] md:col-span-1 md:row-span-2"
                : "aspect-[16/10]"
            }`}
          >
            <div className="absolute inset-0">
              <VenuePhoto venue={venue} sizePx={i === 0 ? 1000 : 700} eager />
            </div>
            <span className="absolute left-2 top-2 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium text-ink shadow-sm">
              {venue.name}
              <span className="hidden text-muted sm:inline">
                {" "}
                &middot; {findOption(NEIGHBORHOOD_OPTIONS, venue.neighborhood).label}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="md:col-start-1 md:row-start-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Philadelphia
        </p>
        <h1 className="mt-3 font-display text-[2.6rem] font-medium leading-[1.04] text-ink sm:text-5xl lg:text-[3.6rem]">
          {HOME_COPY.headlineTop}
          <span className="block text-primary">{HOME_COPY.headlineBottom}</span>
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink/75 sm:text-lg">
          {HOME_COPY.supporting}
        </p>
        <div className="mt-6 flex flex-col items-start gap-3">
          <Link href="/find" className={`${getButtonClasses("primary", "lg")} w-full sm:w-auto`}>
            {HOME_COPY.cta}
            <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
          </Link>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} strokeWidth={2.25} aria-hidden />
            {VENUES.length} hand-picked Philadelphia places
          </p>
        </div>
      </div>
    </section>
  );
}
