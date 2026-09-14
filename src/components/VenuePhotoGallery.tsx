"use client";

import { useEffect, useState } from "react";
import type { Venue } from "@/lib/types";
import {
  VenuePhoto,
  PhotoSkeleton,
  AttributionBadge,
  CACHE_VERSION,
  type ApiPhoto,
  type ApiResponse,
} from "./VenuePhoto";

type GalleryState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; photos: ApiPhoto[]; googleMapsUri?: string };

/**
 * Detail-view hero image. Does its own single fetch for up to 3 photos
 * (never duplicating the card's separate single-photo request — this is
 * only mounted once the detail view opens). When more than one photo
 * comes back, shows a small row of up to 3 thumbnails below the hero;
 * never a full lightbox/carousel, per the brief's "don't overbuild this."
 * With 0 or 1 photo (or no place ID at all), it renders exactly like the
 * plain single-photo view — same skeleton, same illustration fallback.
 */
export function VenuePhotoGallery({ venue }: { venue: Venue }) {
  const [state, setState] = useState<GalleryState>(
    venue.googlePlaceId ? { status: "loading" } : { status: "unavailable" }
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!venue.googlePlaceId) return;
    let cancelled = false;
    fetch(`/api/venue-photo/${venue.id}?w=1200&count=3&v=${CACHE_VERSION}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        setState(data.available ? { status: "ready", photos: data.photos, googleMapsUri: data.googleMapsUri } : { status: "unavailable" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, [venue.id, venue.googlePlaceId]);

  if (state.status === "loading") {
    return (
      <div className="aspect-[16/9] w-full">
        <PhotoSkeleton />
      </div>
    );
  }

  if (state.status === "unavailable" || state.photos.length === 0) {
    // Delegates to the same single-photo fallback chain used everywhere
    // else (static imageUrl, then the category illustration).
    return (
      <div className="aspect-[16/9] w-full">
        <VenuePhoto venue={venue} iconSize={56} sizePx={1200} />
      </div>
    );
  }

  const active = state.photos[activeIndex] ?? state.photos[0];

  return (
    <div>
      <div className="relative aspect-[16/9] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={`${venue.categoryLabel} at ${venue.name}`}
          className="h-full w-full object-cover"
          onError={() => setState({ status: "unavailable" })}
        />
        <AttributionBadge photo={active} googleMapsUri={state.googleMapsUri} />
      </div>
      {state.photos.length > 1 && (
        <div className="flex gap-1.5 p-1.5">
          {state.photos.map((photo, i) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show photo ${i + 1} of ${state.photos.length}`}
              className={`aspect-[16/9] flex-1 overflow-hidden rounded-lg transition-opacity ${
                i === activeIndex ? "opacity-100 ring-2 ring-coral" : "opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
