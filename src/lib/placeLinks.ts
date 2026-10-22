// Links to a place's own page, and how that page reads where the visitor came
// from. A place opened from a search carries that search's URL parameters, so
// the page can say "Why we picked it for you" and send the visitor back to the
// exact same results. Anything else (My Places, the homepage, a shared link)
// has no search context and says "About this place".

import { paramsToPreferences } from "./queryParams";
import type { DatePreferences } from "./types";

export type PlaceOrigin = "my-places" | "home";

/** `/place/<id>`, optionally carrying the search it came from or where from. */
export function placeHref(venueId: string, opts: { search?: string; from?: PlaceOrigin } = {}): string {
  const params = new URLSearchParams(opts.search ?? "");
  params.delete("from");
  if (opts.from) params.set("from", opts.from);
  const query = params.toString();
  return `/place/${venueId}${query ? `?${query}` : ""}`;
}

export interface PlaceContext {
  /** The search this place was opened from, when it was opened from one. */
  prefs: DatePreferences | null;
  /** That search as URL parameters, exactly as the results page keys it. */
  search: string;
  origin: PlaceOrigin | null;
}

export function parsePlaceContext(params: URLSearchParams): PlaceContext {
  const from = params.get("from");
  const origin: PlaceOrigin | null = from === "my-places" || from === "home" ? from : null;
  const rest = new URLSearchParams(params);
  rest.delete("from");
  const prefs = paramsToPreferences(rest);
  return { prefs, search: prefs ? rest.toString() : "", origin };
}

/** Where "Back" goes, and what it says. */
export function backTarget(ctx: PlaceContext): { href: string; label: string } {
  if (ctx.origin === "my-places") return { href: "/my-places", label: "Back to My Places" };
  if (ctx.origin === "home") return { href: "/", label: "Back to home" };
  if (ctx.prefs) return { href: `/results?${ctx.search}`, label: "Back to results" };
  return { href: "/find", label: "Back to Find" };
}
