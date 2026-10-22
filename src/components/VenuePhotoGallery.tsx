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

type Fetched = { photos: ApiPhoto[]; googleMapsUri?: string } | null;

const REQUEST_TIMEOUT_MS = 12_000;

/**
 * One request to the photo route; null means "no usable photos", and a
 * failure or timeout is retried once (a cold server function can take
 * several seconds, and a single hiccup shouldn't leave a blank box).
 */
async function fetchPhotos(venueId: string, query: string, signal: AbortSignal): Promise<Fetched> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
    const onAbort = () => timeout.abort();
    signal.addEventListener("abort", onAbort);
    try {
      const res = await fetch(`/api/venue-photo/${venueId}?${query}&v=${CACHE_VERSION}`, {
        signal: timeout.signal,
      });
      const data = (await res.json()) as ApiResponse;
      if (data.available) return { photos: data.photos, googleMapsUri: data.googleMapsUri };
      // "No photos" is a real answer; only a failed lookup is worth a retry.
      if (data.reason !== "fetch_failed") return null;
    } catch {
      if (signal.aborted) return null;
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    }
  }
  return null;
}

/** Resolves once the browser has the image (or after a few seconds regardless). */
function preload(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = url;
    setTimeout(done, 4000);
  });
}

/**
 * Detail-page hero image.
 *
 * The hero first asks for the SAME single 800px photo the results card
 * already loaded, which the browser and CDN have cached, so arriving from
 * results shows the picture immediately instead of waiting on a cold server.
 * A second request fetches three larger photos for the thumbnail row; the
 * hero swaps to the larger copy only once it has loaded, so nothing flashes.
 * With no photos at all (or no place ID), it falls back exactly like every
 * other photo in the app: static image, then the category illustration.
 */
export function VenuePhotoGallery({ venue }: { venue: Venue }) {
  const hasPlaceId = Boolean(venue.googlePlaceId);
  const [single, setSingle] = useState<Fetched>(null);
  const [set, setSet] = useState<Fetched>(null);
  const [settled, setSettled] = useState(!hasPlaceId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!hasPlaceId) return;
    const controller = new AbortController();
    const { signal } = controller;

    const heroRequest = fetchPhotos(venue.id, "w=800&count=1", signal).then((result) => {
      if (!signal.aborted && result) setSingle(result);
      return result;
    });
    const setRequest = fetchPhotos(venue.id, "w=1200&count=3", signal).then(async (result) => {
      if (signal.aborted) return result;
      if (result?.photos[0]) await preload(result.photos[0].url);
      if (!signal.aborted && result) setSet(result);
      return result;
    });

    Promise.all([heroRequest, setRequest]).then(() => {
      if (!signal.aborted) setSettled(true);
    });
    return () => controller.abort();
  }, [venue.id, hasPlaceId]);

  const photos = set?.photos ?? single?.photos ?? [];
  const mapsUri = set?.googleMapsUri ?? single?.googleMapsUri;

  if (!hasPlaceId || broken || (settled && photos.length === 0)) {
    // Same single-photo fallback chain used everywhere else (static
    // imageUrl, then the category illustration).
    return (
      <div className="aspect-[16/9] w-full">
        <VenuePhoto venue={venue} iconSize={56} sizePx={1200} />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] w-full">
        <PhotoSkeleton />
      </div>
    );
  }

  const active = photos[activeIndex] ?? photos[0];
  const thumbs = set?.photos ?? [];

  return (
    <div>
      <div className="relative aspect-[16/9] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={`${venue.categoryLabel} at ${venue.name}`}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
        <AttributionBadge photo={active} googleMapsUri={mapsUri} />
      </div>
      {thumbs.length > 1 && (
        <div className="flex gap-1.5 p-1.5">
          {thumbs.map((photo, i) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show photo ${i + 1} of ${thumbs.length}`}
              className={`aspect-[16/9] flex-1 overflow-hidden rounded-lg transition-opacity ${
                i === activeIndex ? "opacity-100 ring-2 ring-primary" : "opacity-70 hover:opacity-100"
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
