// Server-only. Never import this from a client component — it reads the
// GOOGLE_PLACES_API_KEY environment variable directly and must never expose
// it to the browser. Talks to Places API (New): Place Details for photo
// metadata (which expires and is never persisted), then Place Photos (New)
// for an actual image URL. See src/app/api/venue-photo/[venueId]/route.ts
// for the only place this is called from.

import type { Venue } from "./types";

const PLACES_BASE = "https://places.googleapis.com/v1";

export type VenuePhotoResult =
  | { available: false; reason: "no_api_key" | "no_place_id" | "no_photos" | "fetch_failed"; debug?: string }
  | {
      available: true;
      photos: Array<{
        url: string;
        width: number;
        height: number;
        attributionText?: string;
        attributionUri?: string;
      }>;
      googleMapsUri?: string;
    };

interface PlaceDetailsPhoto {
  name: string; // e.g. "places/ChIJ.../photos/AXCi..."
  widthPx: number;
  heightPx: number;
  authorAttributions?: Array<{ displayName?: string; uri?: string }>;
}

interface PlaceDetailsResponse {
  photos?: PlaceDetailsPhoto[];
  googleMapsUri?: string;
}

/**
 * Fetches up to `count` photos for a venue's Google Place, preferring the
 * `outdoorIndex`-th photo first when `preferOutdoor` is set and the venue
 * has a curated one (see `Venue.googlePhotoOutdoorIndex`). Returns a
 * discriminated result — never throws — so the API route can always fall
 * back cleanly to the illustration.
 */
export async function fetchVenuePhotos(
  venue: Venue,
  { count = 1, maxWidthPx = 800, preferOutdoor = false }: { count?: number; maxWidthPx?: number; preferOutdoor?: boolean }
): Promise<VenuePhotoResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { available: false, reason: "no_api_key" };
  if (!venue.googlePlaceId) return { available: false, reason: "no_place_id" };

  const clampedCount = Math.max(1, Math.min(3, count));
  const clampedWidth = Math.max(200, Math.min(1600, maxWidthPx));

  let details: PlaceDetailsResponse;
  try {
    const detailsRes = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(venue.googlePlaceId)}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "photos,googleMapsUri",
      },
      // Photo metadata (names) expire — never cache this call beyond a
      // single request lifecycle. Our own route response carries the
      // short-lived HTTP cache header instead (see the route handler).
      cache: "no-store",
    });
    if (!detailsRes.ok) {
      // TEMP DEBUG — remove once the production key issue is diagnosed.
      // Never includes the key itself, only Google's own status/error text.
      const bodyText = await detailsRes.text().catch(() => "");
      return { available: false, reason: "fetch_failed", debug: `details ${detailsRes.status}: ${bodyText.slice(0, 300)}` };
    }
    details = await detailsRes.json();
  } catch (err) {
    return { available: false, reason: "fetch_failed", debug: `details threw: ${err instanceof Error ? err.message : String(err)}` };
  }

  const allPhotos = details.photos ?? [];
  if (allPhotos.length === 0) return { available: false, reason: "no_photos" };

  // Order the candidate list: put the curated outdoor photo first when
  // requested and present, otherwise leave Google's own relevance order
  // (Google returns photos ordered by their own recommendation score,
  // which already tends to surface the most representative shot first).
  let ordered = allPhotos;
  if (preferOutdoor && typeof venue.googlePhotoOutdoorIndex === "number" && allPhotos[venue.googlePhotoOutdoorIndex]) {
    const preferred = allPhotos[venue.googlePhotoOutdoorIndex];
    ordered = [preferred, ...allPhotos.filter((_, i) => i !== venue.googlePhotoOutdoorIndex)];
  }

  const selected = ordered.slice(0, clampedCount);

  try {
    const resolved = await Promise.all(
      selected.map(async (photo) => {
        const mediaRes = await fetch(
          `${PLACES_BASE}/${photo.name}/media?maxWidthPx=${clampedWidth}&skipHttpRedirect=true`,
          { headers: { "X-Goog-Api-Key": apiKey }, cache: "no-store" }
        );
        if (!mediaRes.ok) return null;
        const media = (await mediaRes.json()) as { photoUri?: string };
        if (!media.photoUri) return null;
        const author = photo.authorAttributions?.[0];
        return {
          url: media.photoUri,
          width: photo.widthPx,
          height: photo.heightPx,
          attributionText: author?.displayName ? `Photo: ${author.displayName}, Google` : "Photo: Google",
          attributionUri: author?.uri,
        };
      })
    );
    const photos = resolved.filter((p): p is NonNullable<typeof p> => p !== null);
    if (photos.length === 0) return { available: false, reason: "no_photos" };
    return { available: true, photos, googleMapsUri: details.googleMapsUri };
  } catch {
    return { available: false, reason: "fetch_failed" };
  }
}
