import type { NextConfig } from "next";

// Query parameters the Find screen understands. Before the homepage existed,
// `/` was the Find screen, so links like `/?dateType=first_date&vibe=...`
// (including old "Edit Filters" links) must keep pre-filling it.
const FIND_PARAMS = ["dateType", "vibe", "neighborhood", "budget", "food", "io"];

const nextConfig: NextConfig = {
  // Old links keep working. Query strings are passed through to the
  // destination automatically, so /plan?dateType=...&vibe=... still
  // pre-fills the Find screen.
  async redirects() {
    return [
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
