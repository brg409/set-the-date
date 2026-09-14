import { NextRequest, NextResponse } from "next/server";
import { getVenueById } from "@/data/venues";
import { fetchVenuePhotos } from "@/lib/googlePlaces";

/**
 * The ONLY server-side entry point for venue photos. Accepts nothing but
 * one of our own venue IDs — the Google place ID it maps to is looked up
 * internally from trusted data and is never accepted from the client, so
 * this can't be turned into an open Google Places proxy. Every response is
 * HTTP 200 with `{ available: boolean, ... }`; failures are represented
 * in-band (never thrown) so the client's fallback logic stays simple.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const venue = getVenueById(venueId);

  if (!venue) {
    return NextResponse.json({ available: false, reason: "unknown_venue" });
  }

  const { searchParams } = new URL(request.url);
  const width = Number(searchParams.get("w")) || 800;
  const count = Number(searchParams.get("count")) || 1;
  const preferOutdoor = searchParams.get("outdoor") === "1";

  const result = await fetchVenuePhotos(venue, { count, maxWidthPx: width, preferOutdoor });

  // Cache successful AND unavailable results briefly at the edge/browser so
  // repeat views of the same venue in one session don't re-hit Google or
  // our own function. Google's photo resource names can expire, so this is
  // intentionally short — we re-resolve from the place ID on the next
  // request rather than ever persisting the resolved URL ourselves.
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=1800, s-maxage=1800" },
  });
}
