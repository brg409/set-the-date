import type { NextConfig } from "next";

// Query parameters the Find screen understands. Before the homepage existed,
// `/` was the Find screen, so links like `/?dateType=first_date&vibe=...`
// (including old "Edit Filters" links) must keep pre-filling it.
const FIND_PARAMS = ["dateType", "vibe", "neighborhood", "budget", "food", "io"];

// PostHog ingestion host (US or EU cloud). Analytics events are sent to this
// site's /ingest path and forwarded there; see src/lib/analytics.ts.
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(".i.posthog.com", "-assets.i.posthog.com");

const nextConfig: NextConfig = {
  // PostHog's endpoints end in a slash (/i/v0/e/); without this Next would
  // redirect them to the slash-less path before the rewrite applies.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `${POSTHOG_ASSETS_HOST}/static/:path*` },
      { source: "/ingest/:path*", destination: `${POSTHOG_HOST}/:path*` },
    ];
  },
  // Old links keep working. Query strings are passed through to the
  // destination automatically, so /plan?dateType=...&vibe=... still
  // pre-fills the Find screen.
  async redirects() {
    return [
      // Next's own trailing-slash redirect is off for PostHog (above), so
      // restore it for every other path: /find/ -> /find, as before.
      { source: "/:path((?!ingest/).+)/", destination: "/:path", permanent: true },
      { source: "/plan", destination: "/find", permanent: false },
      { source: "/saved", destination: "/my-places", permanent: false },
      // A bare `/` is the homepage; `/` with any search parameter is an old
      // Find link.
      ...FIND_PARAMS.map((key) => ({
        source: "/",
        has: [{ type: "query" as const, key }],
        destination: "/find",
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
