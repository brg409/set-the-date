"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, RefreshCw, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { VenueResultsGrid } from "@/components/VenueResultsGrid";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { paramsToPreferences } from "@/lib/queryParams";
import { getRecommendations } from "@/lib/recommend";
import { RESULTS_COPY } from "@/lib/copy";
import {
  findOption,
  DATE_TYPE_OPTIONS,
  VIBE_OPTIONS,
  NEIGHBORHOOD_OPTIONS,
  PRICE_LABEL,
} from "@/lib/options";
import type { DatePreferences } from "@/lib/types";

const INITIAL_LOAD_MS = 1100;
const REGENERATE_LOAD_MS = 650;

export default function ResultsClient() {
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const prefs = useMemo(() => paramsToPreferences(searchParams), [searchParams]);

  if (!prefs) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
          <EmptyState
            icon={AlertCircle}
            title="Something's missing"
            body="We couldn't read your preferences from the link. Head back and plan your date again."
            action={
              <Link href="/plan">
                <Button>Plan a date</Button>
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  // Remounted whenever the search itself changes, so loading/exclusion state
  // always starts fresh without needing to reset it inside an effect.
  return <ResultsForPrefs key={paramsKey} prefs={prefs} paramsKey={paramsKey} />;
}

function ResultsForPrefs({
  prefs,
  paramsKey,
}: {
  prefs: DatePreferences;
  paramsKey: string;
}) {
  const [loading, setLoading] = useState(true);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), INITIAL_LOAD_MS);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(
    () => getRecommendations(prefs, { excludeIds: excludedIds }),
    [prefs, excludedIds]
  );

  function handleRegenerate() {
    setLoading(true);
    const shownIds = results.map((r) => r.venue.id);
    window.setTimeout(() => {
      setExcludedIds((prev) => [...prev, ...shownIds]);
      setLoading(false);
    }, REGENERATE_LOAD_MS);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <LoadingScreen />
      </div>
    );
  }

  const dateTypeLabel = findOption(DATE_TYPE_OPTIONS, prefs.dateType).label;
  const vibeLabel = findOption(VIBE_OPTIONS, prefs.vibe).label;
  const neighborhoodLabel = findOption(NEIGHBORHOOD_OPTIONS, prefs.neighborhood).label;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:py-12">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Chip tone="navy">{dateTypeLabel}</Chip>
          <Chip tone="navy">{vibeLabel}</Chip>
          <Chip tone="navy">{neighborhoodLabel}</Chip>
          <Chip tone="navy">{PRICE_LABEL[prefs.budget]}</Chip>
        </div>
        <div className="mb-8">
          <h1 className="font-display text-2xl text-navy sm:text-3xl">
            {RESULTS_COPY.heading}
          </h1>
          <p className="text-sm text-ink/60">{RESULTS_COPY.subheading}</p>
        </div>

        {results.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No matches yet"
            body={RESULTS_COPY.emptyState}
          />
        ) : (
          <VenueResultsGrid results={results} />
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-line pt-8 text-sm">
          <button
            type="button"
            onClick={handleRegenerate}
            className="inline-flex items-center gap-1.5 font-medium text-navy/70 transition-colors hover:text-navy"
          >
            <RefreshCw size={14} strokeWidth={2.25} />
            {RESULTS_COPY.regenerate}
          </button>
          <Link
            href={`/plan?${paramsKey}`}
            className="inline-flex items-center gap-1.5 font-medium text-navy/70 transition-colors hover:text-navy"
          >
            <SlidersHorizontal size={14} strokeWidth={2.25} />
            {RESULTS_COPY.adjustFilters}
          </Link>
        </div>
      </main>
    </div>
  );
}
