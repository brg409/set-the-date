import { ImageResponse } from "next/og";

// Next.js App Router convention: this file's default export becomes the
// site's favicon automatically (no <link> tag or public/favicon.ico
// needed). Kept in sync with the header mark in src/components/Logo.tsx —
// same coral circle, same cream CalendarHeart glyph (inlined as raw SVG
// paths here since this renders via satori in an edge runtime, not React
// DOM, so importing the lucide-react component isn't necessary).
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e2683f",
          borderRadius: "50%",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fbf6ee"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.127 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v5.125" />
          <path d="M14.62 17.8A2.25 2.25 0 1118 14.836a2.25 2.25 0 113.38 2.966l-2.626 2.856a.998.998 0 01-1.507 0z" />
          <path d="M16 2v3" />
          <path d="M3 9h18" />
          <path d="M8 2v3" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
