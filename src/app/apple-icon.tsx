import { ImageResponse } from "next/og";

// Next.js App Router convention: generates the <link rel="apple-touch-icon">
// automatically — what iOS uses for home-screen bookmarks and, on some
// versions, as a fallback link-preview icon. Same coral-circle/cream-glyph
// mark as the header, favicon, and Open Graph image, just at Apple's
// standard 180x180 size (no rounding here — iOS applies its own corner
// mask on top of whatever's supplied).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <svg
          width="112"
          height="112"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fbf6ee"
          strokeWidth="2"
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
