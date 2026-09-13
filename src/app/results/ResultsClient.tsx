"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Pencil,
  MapPin,
  DollarSign,
  TreePine,
  Utensils,
} from "lucide-react";
import { Header } from "@/components/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { VenueDetailModal } from "@/components/VenueDetailModal";
import { VenueCard } from "@/components/VenueCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { paramsToPreferences } from "@/lib/queryParams";
import { getRecommendations, getReplacementVenue, getDateTypeLabel } from "@/lib/recommend";
import { recordNotForMe } from "@/lib/feedback";
import { RESULTS_COPY } from "@/lib/copy";
import {
  findOption,
  VIBE_OPTIONS,
  NEIGHBORHOOD_OPTIONS,
  PRICE_LABEL,
} from "@/lib/options";
import type {
  DatePreferences,
  ExpansionState,
  NotForMeReason,
  ScoredVenue,
} from "@/lib/types";

const INITIAL_LOAD_MS = 900;
const NO_EXPANSION: ExpansionState = {
  neighborhood: false,
  budget: false,
  indoorOutdoor: false,
  food: false,
};

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

  // Remounted whenever the search itself changes, so all local state below
  // starts fresh without needing to reset it inside an effect.
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
  const [expand, setExpand] = useState<ExpansionState>(NO_EXPANSION);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    // Runs once per mount — this component is remounted (via `key`) whenever
    // the search itself changes, so this simulates a fresh "search" each time.
    const timer = setTimeout(() => setLoading(false), INITIAL_LOAD_MS);
    return () => clearTimeout(timer);
  }, []);

  // `results` is the single source of truth for what's on screen. Every
  // action below (expanding the search, regenerating, dismissing one card)
  // updates it explicitly and directly — there's no separate "recompute on
  // dependency change" effect, so a single "Not for me" can never be
  // clobbered by an unrelated recompute reshuffling all three.
  const [results, setResults] = useState<ScoredVenue[]>(
    () => getRecommendations(prefs, { expand: NO_EXPANSION, count: 3 }).results
  );

  // Banner/eligibility info only — depends on prefs + expand, not on which
  // three venues happen to be displayed right now.
  const meta = useMemo(() => getRecommendations(prefs, { expand, count: 3 }), [prefs, expand]);

  function applyExpansion(next: ExpansionState) {
    setExpand(next);
    setExcludedIds([]);
    setResults(getRecommendations(prefs, { expand: next, count: 3 }).results);
  }

  function handleRegenerate() {
    const newExcluded = [...excludedIds, ...results.map((r) => r.venue.id)];
    setExcludedIds(newExcluded);
    setResults(getRecommendations(prefs, { expand, excludeIds: newExcluded, count: 3 }).results);
  }

  function handleNotForMe(venueId: string, reason: NotForMeReason | null) {
    recordNotForMe(venueId, reason, prefs);
    const keepIds = results.filter((r) => r.venue.id !== venueId).map((r) => r.venue.id);
    const newExcluded = [...excludedIds, venueId];
    const replacement = getReplacementVenue(prefs, expand, [...newExcluded, ...keepIds]);
    setExcludedIds(newExcluded);
    setResults((prev) => {
      const withoutDismissed = prev.filter((r) => r.venue.id !== venueId);
      return replacement ? [...withoutDismissed, replacement] : withoutDismissed;
    });
  }

  const selected = results.find((r) => r.venue.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <LoadingScreen />
      </div>
    );
  }

  const dateTypeLabel = getDateTypeLabel(prefs.dateType);
  const vibeLabel = findOption(VIBE_OPTIONS, prefs.vibe).label;
  const neighborhoodLabel = findOption(NEIGHBORHOOD_OPTIONS, prefs.neighborhood).label;
  const budgetLabel = PRICE_LABEL[prefs.budget];

  const anyExpansionAvailable =
    meta.canExpandNeighborhood ||
    meta.canExpandBudget ||
    meta.canExpandIndoorOutdoor ||
    meta.canExpandFood;
  const anyExpansionActive = expand.neighborhood || expand.budget || expand.indoorOutdoor || expand.food;
  const needsExpansionChoice = meta.exactMatchCount < 3 && anyExpansionAvailable;

  const limitingFilters = [
    `${neighborhoodLabel}`,
    `${budgetLabel} or less`,
    prefs.filters?.indoorOutdoor ? prefs.filters.indoorOutdoor + " seating" : null,
    prefs.filters?.food ? `${prefs.filters.food} only` : null,
  ].filter((v): v is string => Boolean(v));

  const expansionButtons = (size: "sm" | "md") => (
    <div className="flex flex-wrap justify-center gap-2">
      {meta.canExpandNeighborhood && (
        <Button variant="outline" size={size} onClick={() => applyExpansion({ ...expand, neighborhood: true })}>
          <MapPin size={size === "sm" ? 14 : 15} strokeWidth={2.25} />
          Include nearby neighborhoods
        </Button>
      )}
      {meta.canExpandBudget && (
        <Button variant="outline" size={size} onClick={() => applyExpansion({ ...expand, budget: true })}>
          <DollarSign size={size === "sm" ? 14 : 15} strokeWidth={2.25} />
          Allow a higher budget
        </Button>
      )}
      {meta.canExpandIndoorOutdoor && (
        <Button
          variant="outline"
          size={size}
          onClick={() => applyExpansion({ ...expand, indoorOutdoor: true })}
        >
          <TreePine size={size === "sm" ? 14 : 15} strokeWidth={2.25} />
          Include {prefs.filters?.indoorOutdoor === "outdoor" ? "indoor" : "outdoor"} spots too
        </Button>
      )}
      {meta.canExpandFood && (
        <Button variant="outline" size={size} onClick={() => applyExpansion({ ...expand, food: true })}>
          <Utensils size={size === "sm" ? 14 : 15} strokeWidth={2.25} />
          Drop the {prefs.filters?.food} filter
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-8 pt-6 sm:pb-12 sm:pt-8">
        <div className="mb-4 flex flex-wrap gap-1.5">
          <EditablePill paramsKey={paramsKey} step="dateType" label={dateTypeLabel} />
          <EditablePill paramsKey={paramsKey} step="vibe" label={vibeLabel} />
          <EditablePill paramsKey={paramsKey} step="neighborhood" label={neighborhoodLabel} />
          <EditablePill paramsKey={paramsKey} step="budget" label={budgetLabel} />
        </div>

        <div className="mb-6 scroll-mt-24">
          <h1 className="font-display text-2xl text-navy sm:text-3xl">
            {results.length === 3
              ? RESULTS_COPY.heading
              : results.length === 0
                ? "No spots yet"
                : `Your ${results.length} spot${results.length > 1 ? "s" : ""}`}
          </h1>
          <p className="text-sm text-ink/60">{RESULTS_COPY.subheading}</p>
        </div>

        {meta.exactMatchCount === 0 && !anyExpansionActive && (
          <EmptyState
            icon={AlertCircle}
            title={`No exact matches for ${limitingFilters.join(", ")}`}
            body="Nothing in our data satisfies every selected filter yet. Widen the search to see options — nothing gets substituted without asking first."
            action={anyExpansionAvailable ? expansionButtons("md") : undefined}
          />
        )}

        {meta.exactMatchCount > 0 && needsExpansionChoice && (
          <div className="mb-6 rounded-2xl border border-gold/40 bg-gold/10 p-4">
            <p className="text-sm text-ink">
              Only <strong>{meta.exactMatchCount}</strong>{" "}
              {meta.exactMatchCount === 1 ? "spot matches" : "spots match"} every filter exactly
              ({limitingFilters.join(", ")}) for a {dateTypeLabel}. Showing
              {meta.exactMatchCount === 1 ? " that one" : " those"} below — widen the search for
              more:
            </p>
            <div className="mt-3">{expansionButtons("sm")}</div>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((scored, i) => (
              <VenueCard
                key={scored.venue.id}
                scored={scored}
                rank={i + 1}
                onViewDetails={setSelectedId}
                prefs={prefs}
                onNotForMe={handleNotForMe}
              />
            ))}
          </div>
        )}

        {results.length > 0 && (
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
              {RESULTS_COPY.editPreferences}
            </Link>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-ink/40">
          Venue details and availability can change — double check before you go.
        </p>
      </main>

      {selected && (
        <VenueDetailModal
          venue={selected.venue}
          whyItFits={selected.whyItFits}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function EditablePill({
  paramsKey,
  step,
  label,
}: {
  paramsKey: string;
  step: "dateType" | "vibe" | "neighborhood" | "budget";
  label: string;
}) {
  return (
    <Link
      href={`/plan?${paramsKey}&focus=${step}`}
      className="group inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-navy-light"
    >
      {label}
      <Pencil
        size={11}
        strokeWidth={2.5}
        className="text-cream/50 transition-colors group-hover:text-cream"
      />
    </Link>
  );
}
