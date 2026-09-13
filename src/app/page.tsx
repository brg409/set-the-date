import Link from "next/link";
import { ArrowRight, Compass, MessageCircleHeart, ListFilter } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { VenueResultsGrid } from "@/components/VenueResultsGrid";
import { getRecommendations } from "@/lib/recommend";
import { BRAND } from "@/lib/copy";
import type { DatePreferences } from "@/lib/types";

const EXAMPLE_PREFS: DatePreferences = {
  dateType: "first_date",
  vibe: "cozy_intimate",
  neighborhood: "rittenhouse",
  budget: 2,
};

export default function LandingPage() {
  const previewResults = getRecommendations(EXAMPLE_PREFS).results;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-14 sm:pb-24 sm:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-sand px-3.5 py-1.5 text-xs font-medium text-navy/70">
              Prototype &middot; Philadelphia neighborhoods
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.1] text-navy sm:text-5xl">
              {BRAND.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink/70 sm:text-lg">
              {BRAND.subhead}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/plan">
                <Button size="lg">
                  {BRAND.ctaPrimary}
                  <ArrowRight size={17} strokeWidth={2.25} />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" size="lg">
                  {BRAND.ctaSecondary}
                </Button>
              </a>
            </div>
            <p className="mt-6 font-display text-lg italic text-navy/70">
              &ldquo;{BRAND.tagline}&rdquo;
            </p>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-line bg-white/60">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-navy">
                  <ListFilter size={18} strokeWidth={2} />
                </span>
                <h3 className="mt-3 font-display text-lg text-navy">
                  Tell us about the date
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                  Occasion, vibe, neighborhood, and budget — four quick taps, not a survey.
                </p>
              </div>
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-navy">
                  <Compass size={18} strokeWidth={2} />
                </span>
                <h3 className="mt-3 font-display text-lg text-navy">
                  We match on fit, not popularity
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                  Not the highest-rated spot in the city — the right spot for this date.
                </p>
              </div>
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-navy">
                  <MessageCircleHeart size={18} strokeWidth={2} />
                </span>
                <h3 className="mt-3 font-display text-lg text-navy">
                  Three spots, each with a reason
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                  No endless scrolling — just three options and a clear &ldquo;why it fits.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16">
          <div className="mb-8 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-navy sm:text-3xl">
                A first date, cozy and intimate, in Rittenhouse
              </h2>
              <p className="text-sm text-ink/60">
                A live example — this is exactly what the app returns.
              </p>
            </div>
            <Link
              href="/plan"
              className="text-sm font-medium text-coral-dark hover:text-coral-dark/80"
            >
              Try your own combination &rarr;
            </Link>
          </div>
          <VenueResultsGrid results={previewResults} />
        </section>

        <section className="border-t border-line bg-navy">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center">
            <p className="font-display text-2xl italic leading-snug text-cream sm:text-3xl">
              &ldquo;{BRAND.positioning}&rdquo;
            </p>
            <Link href="/plan" className="mt-8 inline-block">
              <Button size="lg">
                {BRAND.ctaPrimary}
                <ArrowRight size={17} strokeWidth={2.25} />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8 text-center text-xs text-ink/45">
        Set the Date is a prototype. Rittenhouse venues are real Philadelphia
        spots; other neighborhoods use illustrative sample data. Attributes
        like noise and romance are editorial judgment calls, not measured
        data.
      </footer>
    </div>
  );
}
