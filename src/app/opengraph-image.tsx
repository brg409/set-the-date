import { ImageResponse } from "next/og";

// Next.js App Router convention: this becomes the site's Open Graph /
// Twitter card image automatically (no meta tags needed) — what iMessage,
// WhatsApp, Slack, etc. show as the big preview image when someone shares
// the site's URL. Same gold-circle/wine-glyph mark as the header and
// favicon, on the site's dark wine background, so a shared link actually
// reads as "Know a Place" instead of falling back to a generic default.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#40202f",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "#d3a76f",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <svg
            width="88"
            height="88"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2c1422"
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
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 600,
            color: "#f9f0e2",
            letterSpacing: "-0.02em",
          }}
        >
          Know a Place
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#f9f0e2",
            opacity: 0.7,
            marginTop: 18,
          }}
        >
          Every date deserves the right spot
        </div>
      </div>
    ),
    { ...size }
  );
}
