"use client";

import { useEffect, useState } from "react";
import {
  Martini,
  Wine,
  UtensilsCrossed,
  Building2,
  Coffee,
  Beer,
  IceCreamCone,
  Gamepad2,
  CircleDot,
  Sparkles,
  Music,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import type { Venue, VenueCategory } from "@/lib/types";

/**
 * Renders a real Google Places photo when one is available for the venue,
 * otherwise falls back to the original designed gradient + icon
 * placeholder keyed on category — unchanged from before this feature
 * existed. This is the ONLY thing that changes: the layout slot, aspect
 * ratio, and fallback illustration are exactly what they were.
 */

const CATEGORY_GRADIENT: Record<VenueCategory, string> = {
  cocktail_bar: "from-[#241835] via-[#3a2148] to-[#1f2a44]",
  wine_bar: "from-[#4a1f2b] via-[#5c2836] to-[#2a1620]",
  restaurant: "from-[#5c3b23] via-[#7a4a2a] to-[#3d2817]",
  rooftop_bar: "from-[#1f2a44] via-[#33436a] to-[#e2683f]/60",
  cafe: "from-[#4b3826] via-[#6b5238] to-[#3a2c1c]",
  activity: "from-[#1d4a4a] via-[#2c6363] to-[#c99a3c]/70",
  brewery: "from-[#3b2a17] via-[#5c4020] to-[#2a1d10]",
  dessert: "from-[#5c2b3f] via-[#7a3a52] to-[#3d1c2a]",
};

const CATEGORY_ICON: Record<VenueCategory, LucideIcon> = {
  cocktail_bar: Martini,
  wine_bar: Wine,
  restaurant: UtensilsCrossed,
  rooftop_bar: Building2,
  cafe: Coffee,
  activity: Sparkles,
  brewery: Beer,
  dessert: IceCreamCone,
};

// A few activity venues get a more specific icon than the category default.
const VENUE_ICON_OVERRIDE: Record<string, LucideIcon> = {
  "mural-alley-bocce": CircleDot,
  "barcade-fishtown": Gamepad2,
  "kung-fu-necktie": Music,
  "the-fillmore-philadelphia": Music,
};

export function IllustrationFallback({
  venue,
  className = "",
  iconSize = 40,
}: {
  venue: Venue;
  className?: string;
  iconSize?: number;
}) {
  const Icon = VENUE_ICON_OVERRIDE[venue.id] ?? CATEGORY_ICON[venue.category];
  const gradient = CATEGORY_GRADIENT[venue.category];

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      <Icon size={iconSize} strokeWidth={1.5} className="relative text-white/90" />
    </div>
  );
}

export interface ApiPhoto {
  url: string;
  width: number;
  height: number;
  attributionText?: string;
  attributionUri?: string;
}
export type ApiResponse =
  | { available: false; reason: string }
  | { available: true; photos: ApiPhoto[]; googleMapsUri?: string };

type PhotoState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "static"; url: string }
  | { status: "ready"; photos: ApiPhoto[]; googleMapsUri?: string };

// Bump this when the /api/venue-photo response shape changes, or to force
// past CDN/browser caches of a since-fixed failure to expire immediately
// instead of waiting out their remaining Cache-Control TTL.
export const CACHE_VERSION = "2";

// Module-level cache: dedupes fetches for the same venue (+ outdoor
// preference) across every card/detail view mounted during this browser
// session. Intentionally in-memory only — we never persist Google's photo
// URLs beyond the current session, since the underlying resource names can
// expire and must be re-resolved from the place ID next time.
const photoCache = new Map<string, PhotoState>();
// Tracks requests still in flight so two components mounting for the same
// venue at the same instant (e.g. it appears in both a results list and a
// just-opened detail view) share one fetch instead of firing two.
const pendingFetches = new Map<string, Promise<PhotoState>>();
function cacheKey(venueId: string, count: number, preferOutdoor: boolean) {
  return `${venueId}:${count}:${preferOutdoor ? "outdoor" : "default"}`;
}

/** A plain grey pulse shown only while the photo request is in flight. */
export function PhotoSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`h-full w-full animate-pulse bg-navy/10 ${className}`} aria-hidden />
  );
}

/**
 * `linkable` must be false whenever this renders inside a native `<button>`
 * (the recommendation card's photo is itself a button) — a nested `<a>`
 * inside a `<button>` is invalid HTML and breaks click handling. The card
 * still shows the attribution text either way (never hidden for visual
 * cleanliness); only the clickable jump to the photo's Google Maps source
 * is deferred to the detail view, which isn't inside a button.
 */
export function AttributionBadge({
  photo,
  googleMapsUri,
  linkable = true,
}: {
  photo: ApiPhoto;
  googleMapsUri?: string;
  linkable?: boolean;
}) {
  const href = linkable ? photo.attributionUri ?? googleMapsUri : undefined;
  const label = photo.attributionText ?? "Photo: Google";
  const content = (
    <span className="inline-flex items-center gap-1 rounded-full bg-navy/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
      {label}
      {href && <ExternalLink size={10} strokeWidth={2.5} />}
    </span>
  );
  return (
    <div className="absolute bottom-2 right-2 z-[1]">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

export function VenuePhoto({
  venue,
  className = "",
  iconSize = 40,
  sizePx = 800,
  preferOutdoor = false,
  linkAttribution = true,
}: {
  venue: Venue;
  className?: string;
  iconSize?: number;
  /** Requested image width in px — the API route clamps this to a sane range. */
  sizePx?: number;
  /** Set when the user has selected the outdoor filter, to prefer a curated outdoor photo. */
  preferOutdoor?: boolean;
  /** False when this is rendered inside a native `<button>` (e.g. the recommendation card), where a nested link isn't valid HTML. */
  linkAttribution?: boolean;
}) {
  const key = cacheKey(venue.id, 1, preferOutdoor);
  const initialState = (): PhotoState => {
    if (!venue.googlePlaceId) {
      // No Google photo pipeline for this venue — fall back to a manually
      // set static photo if one exists, exactly as before this feature.
      return venue.imageUrl ? { status: "static", url: venue.imageUrl } : { status: "unavailable" };
    }
    return photoCache.get(key) ?? { status: "loading" };
  };
  const [state, setState] = useState<PhotoState>(initialState);

  useEffect(() => {
    // Nothing to fetch: either already resolved (cache hit reflected in the
    // initializer above) or there's no place ID to look up at all.
    if (!venue.googlePlaceId || photoCache.has(key)) return;

    let cancelled = false;

    let inFlight = pendingFetches.get(key);
    if (!inFlight) {
      const params = new URLSearchParams({ w: String(sizePx), count: "1", v: CACHE_VERSION });
      if (preferOutdoor) params.set("outdoor", "1");
      inFlight = fetch(`/api/venue-photo/${venue.id}?${params.toString()}`)
        .then((r) => r.json() as Promise<ApiResponse>)
        .then((data): PhotoState => (data.available ? { status: "ready", photos: data.photos, googleMapsUri: data.googleMapsUri } : { status: "unavailable" }))
        .catch((): PhotoState => ({ status: "unavailable" }))
        .then((next) => {
          photoCache.set(key, next);
          pendingFetches.delete(key);
          return next;
        });
      pendingFetches.set(key, inFlight);
    }

    inFlight.then((next) => {
      if (!cancelled) setState(next);
    });

    return () => {
      cancelled = true;
    };
  }, [key, venue.id, venue.googlePlaceId, sizePx, preferOutdoor]);

  if (state.status === "loading") {
    return <PhotoSkeleton className={className} />;
  }

  if (state.status === "static") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={state.url}
        alt={venue.name}
        loading="lazy"
        className={`h-full w-full object-cover object-center ${className}`}
        onError={() => setState({ status: "unavailable" })}
      />
    );
  }

  if (state.status === "ready" && state.photos[0]) {
    const photo = state.photos[0];
    return (
      <div className={`relative h-full w-full ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={`${venue.categoryLabel} interior at ${venue.name}`}
          loading="lazy"
          className="h-full w-full object-cover object-center"
          onError={() => setState({ status: "unavailable" })}
        />
        <AttributionBadge photo={photo} googleMapsUri={state.googleMapsUri} linkable={linkAttribution} />
      </div>
    );
  }

  return <IllustrationFallback venue={venue} className={className} iconSize={iconSize} />;
}
