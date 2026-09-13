import type { Venue } from "./types";

/**
 * These venues are prototype data with no real reservation or map records,
 * so we build best-effort links instead of hard-coding fake external URLs.
 * Once a real data provider is wired up, swap these for the provider's own
 * `reservationUrl` / `mapsUrl` fields.
 */

export function getDirectionsUrl(venue: Venue): string {
  const query = encodeURIComponent(`${venue.name}, ${venue.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getReserveUrl(venue: Venue): string {
  if (venue.reservationUrl) return venue.reservationUrl;
  if (venue.websiteUrl) return venue.websiteUrl;
  const query = encodeURIComponent(`${venue.name} Philadelphia reservations`);
  return `https://www.google.com/search?q=${query}`;
}
