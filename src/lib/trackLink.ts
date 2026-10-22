// Outbound links (Reserve a Table, Visit Website) are tracked with data
// attributes read by one listener in analytics.ts, so the components that
// render them don't need to be client components or import PostHog.

export const LINK_EVENTS = ["reserve_click", "website_click"] as const;
export const LINK_SOURCES = ["results", "place", "my-places"] as const;

export function trackLinkProps(
  event: (typeof LINK_EVENTS)[number],
  venueId: string,
  from: (typeof LINK_SOURCES)[number],
) {
  return { "data-track": event, "data-venue-id": venueId, "data-track-from": from };
}
