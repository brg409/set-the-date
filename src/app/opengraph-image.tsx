import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Next.js App Router convention: this becomes the site's Open Graph /
// Twitter card image automatically — what iMessage, WhatsApp, Slack, etc.
// show as the big preview when someone shares the URL. It is the supplied
// KnowaPlace logo, untouched, centered on the app's background color.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  // PNG, not the WebP the site itself serves: the renderer can't decode WebP.
  const logo = readFileSync(join(process.cwd(), "public", "knowaplace-logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;

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
          background: "#faf9fd",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="KnowaPlace" width={900} height={230} style={{ objectFit: "contain" }} />
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 34,
            color: "#6b6479",
          }}
        >
          Every date deserves the right spot
        </div>
      </div>
    ),
    { ...size }
  );
}
