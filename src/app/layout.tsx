import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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

const TITLE = "Set the Date — Every date deserves the right spot";
const DESCRIPTION =
  "Set the Date recommends places based on the occasion and experience you want, not just what's popular nearby.";

export const metadata: Metadata = {
  // Needed so the auto-detected opengraph-image/twitter-image/apple-icon
  // files below resolve to absolute URLs for link-preview crawlers (they
  // can't follow a relative path the way a browser can).
  metadataBase: new URL("https://set-the-date-two.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Set the Date",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
