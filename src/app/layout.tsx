import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ToastHost } from "@/components/ToastHost";
import { preconnect } from "react-dom";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const TITLE = "KnowaPlace — Know the place. Love the night.";
const DESCRIPTION =
  "KnowaPlace helps you discover great restaurants, bars, and experiences that fit your occasion, preferences, and vibe — without spending hours searching.";

export const metadata: Metadata = {
  // Needed so the auto-detected opengraph-image/apple-icon files resolve to
  // absolute URLs for link-preview crawlers (they can't follow a relative
  // path the way a browser can). Vercel sets VERCEL_PROJECT_PRODUCTION_URL to
  // the production domain (a custom domain once one is added), so previews
  // and production builds both point at the live site.
  metadataBase: new URL(
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "set-the-date-two.vercel.app"}`,
  ),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "KnowaPlace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// `viewportFit: "cover"` lets the page extend under the iPhone notch/home
// bar; the header and bottom nav then add the matching safe-area padding.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf9fd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Place photos are served from Google's image host; opening the connection
  // early shaves the handshake off the first photo.
  preconnect("https://lh3.googleusercontent.com");

  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-page text-ink">
        <Header />
        <div className="flex flex-1 flex-col pb-[calc(var(--nav-height)+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </div>
        <BottomNav />
        <ToastHost />
        {/* Vercel Web Analytics: visitors, page views, devices. No cookies. */}
        <Analytics />
      </body>
    </html>
  );
}
