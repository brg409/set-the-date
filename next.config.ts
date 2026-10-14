import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old links keep working. Query strings are passed through to the
  // destination automatically, so /plan?dateType=...&vibe=... still
  // pre-fills the Find screen.
  async redirects() {
    return [
      { source: "/plan", destination: "/", permanent: false },
      { source: "/saved", destination: "/my-places", permanent: false },
    ];
  },
};

export default nextConfig;
