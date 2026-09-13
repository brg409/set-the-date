import type { Venue } from "./types";

/**
 * Directions always have a valid destination — we always know a real
 * address, so a Google Maps search-by-address link is a genuine action,
 * not a placeholder.
 */
export function getDirectionsUrl(venue: Venue): string {
  const query = encodeURIComponent(`${venue.name}, ${venue.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Reserve/website only has a valid destination when the venue actually has
 * one on file. Returns undefined (rather than a generic search-engine
 * fallback) so callers can hide the action entirely instead of showing a
 * dead-feeling placeholder link.
 */
export function getReserveUrl(venue: Venue): string | undefined {
  return venue.reservationUrl ?? venue.websiteUrl ?? undefined;
}
