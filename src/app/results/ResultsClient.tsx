"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  MapPin,
  SlidersHorizontal,
  TreePine,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { VenueCard } from "@/components/VenueCard";
import { EmptyState } from "@/components/EmptyState";
import { Button, getButtonClasses } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { paramsToPreferences } from "@/lib/queryParams";
import {
  getRecommendations,
  getReplacementVenue,
  getDateTypeLabel,
} from "@/lib/recommend";
import { recordNotForMe } from "@/lib/feedback";
import { RESULTS_COPY } from "@/lib/copy";
import { placeHref } from "@/lib/placeLinks";
import { outingLabel } from "@/lib/outing";
import {
  freshSession,
  hydrateSet,
  NO_EXPANSION,
  loadResultSession,
  nextSet,
  saveResultSession,
  type ResultSession,
} from "@/lib/resultSession";
import { useIsClient } from "@/hooks/useIsClient";
import { trackNotForMe, trackRecommendationShown, trackSearch, trackSearchWidened } from "@/lib/analytics";
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
  PriceLevel,
} from "@/lib/types";

const INITIAL_LOAD_MS = 900;

export default function ResultsClient() {
  const isClient = useIsClient();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const prefs = useMemo(() => paramsToPreferences(searchParams), [searchParams]);

  if (!isClient) return <LoadingScreen />;

  if (!prefs) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <EmptyState
          icon={AlertCircle}
          title="Something's missing"
          body="We couldn't read your preferences from the link. Head back and choose again."
          action={
            <Link href="/find" className={getButtonClasses("primary", "md")}>
              Find a place
            </Link>
          }
        />
      </main>
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
  // Restored from this tab's session when the user comes back (from a detail
  // view, another tab, or a refresh): the exact sets they were shown, in the
  // same order, with the same dismissals and widened filters.
  const [restored] = useState(() => loadResultSession(paramsKey));
  const [session, setSession] = useState<ResultSession>(
    () => restored ?? freshSession(prefs)
  );
  const [loading, setLoading] = useState(() => restored === null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const didMount = useRef(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), INITIAL_LOAD_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    saveResultSession(paramsKey, session);
  }, [paramsKey, session]);

  // After moving between sets, bring the top of the results back into view.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [session.cursor, session.sets.length]);

  const { expand, cursor, sets, excluded } = session;
  const results = useMemo(() => hydrateSet(sets[cursor], prefs), [sets, cursor, prefs]);
  const seenBefore = useMemo(() => new Set(sets.slice(0, cursor).flat()), [sets, cursor]);

  // Banner/eligibility info only — depends on prefs + expand, not on which
  // venues happen to be displayed right now.
  const meta = useMemo(() => getRecommendations(prefs, { expand, count: 3 }), [prefs, expand]);

  // Analytics. A search counts once, when it's new (not when coming back to
  // it); each venue counts once per search when it's first on screen.
  const searchTracked = useRef(restored !== null);
  const shownTracked = useRef(new Set(restored ? restored.sets.flat() : []));
  useEffect(() => {
    if (searchTracked.current) return;
    searchTracked.current = true;
    trackSearch(prefs, meta.exactMatchCount);
  }, [prefs, meta.exactMatchCount]);
  useEffect(() => {
    if (loading) return;
    const widened = Object.values(expand).some(Boolean);
    results.forEach((r, i) => {
      if (shownTracked.current.has(r.venue.id)) return;
      shownTracked.current.add(r.venue.id);
      trackRecommendationShown(r.venue.id, { position: i + 1, set: cursor + 1, widened });
    });
  }, [loading, results, expand, cursor]);

  function applyExpansion(next: ExpansionState) {
    const added = (Object.keys(next) as (keyof ExpansionState)[]).find((k) => next[k] && !expand[k]);
    if (added) trackSearchWidened(prefs, added, meta.exactMatchCount);
    const first = getRecommendations(prefs, { expand: next, count: 3 }).results;
    setSession({
      sets: [first.map((r) => r.venue.id)],
      cursor: 0,
      excluded: [],
      expand: next,
    });
  }

  function showMore() {
    if (cursor < sets.length - 1) {
      setSession({ ...session, cursor: cursor + 1 });
      return;
    }
    const seen = [...new Set([...sets.flat(), ...excluded])];
    const ids = nextSet(prefs, expand, seen);
    if (ids.length === 0) return;
    setSession({ ...session, sets: [...sets, ids], cursor: cursor + 1 });
  }

  function showPrevious() {
    if (cursor === 0) return;
    setSession({ ...session, cursor: cursor - 1 });
  }

  function handleNotForMe(venueId: string, reason: NotForMeReason | null) {
    recordNotForMe(venueId, reason, prefs);
    const current = sets[cursor];
    trackNotForMe(venueId, reason, prefs, current.indexOf(venueId) + 1);
    const keep = current.filter((id) => id !== venueId);
    const newExcluded = [...excluded, venueId];
    const replacement = getReplacementVenue(prefs, expand, [
      ...newExcluded,
      ...keep,
      ...sets.flat(),
    ]);
    const nextCurrent = replacement ? [...keep, replacement.venue.id] : keep;
    setSession({
      ...session,
      excluded: newExcluded,
      sets: sets.map((set, i) => (i === cursor ? nextCurrent : set)),
    });
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const dateTypeLabel = getDateTypeLabel(prefs.dateType);
  const vibeLabel = findOption(VIBE_OPTIONS, prefs.vibe).label;
  const neighborhoodLabel = findOption(NEIGHBORHOOD_OPTIONS, prefs.neighborhood).label;
  const budgetLabel = PRICE_LABEL[prefs.budget];
  const wantedOuting = prefs.filters?.outing;
  const moodLabel = wantedOuting ? outingLabel(wantedOuting) : null;
  // Coffee and Dessert show at any budget, so there's no budget limit to name.
  const budgetIsALimit = wantedOuting !== "coffee" && wantedOuting !== "dessert";
  const foodLabel = prefs.filters?.food
    ? prefs.filters.food.charAt(0).toUpperCase() + prefs.filters.food.slice(1) + " only"
    : null;
  const indoorOutdoorLabel = prefs.filters?.indoorOutdoor
    ? prefs.filters.indoorOutdoor.charAt(0).toUpperCase() + prefs.filters.indoorOutdoor.slice(1)
    : null;

  const anyExpansionAvailable =
    meta.canExpandNeighborhood ||
    meta.canExpandBudget ||
    meta.canExpandIndoorOutdoor ||
    meta.canExpandFood ||
    meta.canExpandOuting;
  const anyExpansionActive =
    expand.neighborhood || expand.budget || expand.indoorOutdoor || expand.food || expand.outing;
  const needsExpansionChoice = meta.exactMatchCount < 3 && anyExpansionAvailable;

  const limitingFilters = [
    moodLabel,
    `${neighborhoodLabel}`,
    budgetIsALimit
      ? prefs.budget === 1
        ? budgetLabel
        : `${PRICE_LABEL[(prefs.budget - 1) as PriceLevel]}–${budgetLabel}`
      : null,
    prefs.filters?.indoorOutdoor ? prefs.filters.indoorOutdoor + " seating" : null,
    prefs.filters?.food ? `${prefs.filters.food} only` : null,
  ].filter((v): v is string => Boolean(v));

  const expansionButtons = (size: "sm" | "md") => (
    <div className="flex flex-wrap justify-center gap-2">
      {meta.canExpandNeighborhood && (
        <Button variant="outline" size={size} onClick={() => applyExpansion({ ...expand, neighborhood: true })}>
          <MapPin size={size === "sm" ? 14 : 15} strokeWidth={2.25} />
          Include other neighborhoods
        </Button>
      )}
      {meta.canExpandBudget && (
        <Button variant="outline" size={size} onClick={() => applyExpansion({ ...expand, budget: true })}>
          <DollarSign size={size === "sm" ? 14 : 15} strokeWidth={2.25} />
          Widen the budget
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
      {meta.canExpandOuting && (
        <Button variant="outline" size={size} onClick={() => applyExpansion({ ...expand, outing: true })}>
          <UtensilsCrossed size={size === "sm" ? 14 : 15} strokeWidth={2.25} />
          Show all kinds of places
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

  const isRepeat = results.some((r) => seenBefore.has(r.venue.id));
  const isLastOfMatches = cursor > 0 && results.length > 0 && results.length < 3 && !isRepeat;
  const canGoForward = cursor < sets.length - 1;
  const hasPool = meta.exactMatchCount > 0 || anyExpansionActive;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-8 pt-6 sm:pt-8">
      <div className="flex items-start justify-between gap-3">
        <div className="scroll-mt-24">
          <h1 ref={headingRef} className="font-display text-2xl text-ink sm:text-3xl">
            {RESULTS_COPY.heading}
          </h1>
          <p className="mt-1 text-sm text-muted">{results.length === 3 ? RESULTS_COPY.subheading : RESULTS_COPY.subheadingFew}</p>
        </div>
        <Link
          href={`/find?${paramsKey}`}
          className={`${getButtonClasses("outline", "sm")} shrink-0`}
        >
          <SlidersHorizontal size={15} strokeWidth={2.25} />
          {RESULTS_COPY.editFilters}
        </Link>
      </div>

      <div className="mb-5 mt-4 flex flex-wrap gap-1.5">
        <Chip>{dateTypeLabel}</Chip>
        <Chip>{vibeLabel}</Chip>
        {moodLabel && <Chip>{moodLabel}</Chip>}
        <Chip>{neighborhoodLabel}</Chip>
        <Chip>{budgetLabel}</Chip>
        {foodLabel && <Chip>{foodLabel}</Chip>}
        {indoorOutdoorLabel && <Chip>{indoorOutdoorLabel}</Chip>}
      </div>

      {meta.exactMatchCount === 0 && !anyExpansionActive && (
        <EmptyState
          icon={AlertCircle}
          title={`No exact matches for ${limitingFilters.join(", ")}`}
          body="Nothing in our data satisfies every selected filter yet. Widen the search to see options — nothing gets substituted without asking first."
          action={anyExpansionAvailable ? expansionButtons("md") : undefined}
        />
      )}

      {anyExpansionActive && results.length > 0 && (
        <div className="mb-6 rounded-2xl border border-accent bg-accent/20 p-4">
          <p className="text-sm text-ink">
            This search was widened, so some places below are outside your original filters.
            Each one is labelled.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {expansionButtons("sm")}
            <Button variant="outline" size="sm" onClick={() => applyExpansion(NO_EXPANSION)}>
              <ArrowLeft size={14} strokeWidth={2.25} />
              Back to exact matches
            </Button>
          </div>
        </div>
      )}

      {!anyExpansionActive && meta.exactMatchCount > 0 && needsExpansionChoice && (
        <div className="mb-6 rounded-2xl border border-accent bg-accent/20 p-4">
          <p className="text-sm text-ink">
            Only <strong>{meta.exactMatchCount}</strong>{" "}
            {meta.exactMatchCount === 1 ? "spot matches" : "spots match"} every filter exactly
            ({limitingFilters.join(", ")}) for {dateTypeLabel}. Showing
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
              detailHref={placeHref(scored.venue.id, { search: paramsKey })}
              prefs={prefs}
              fromSearch={paramsKey}
              onNotForMe={handleNotForMe}
            />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
          {isRepeat && (
            <p className="text-center text-sm text-muted">
              You&rsquo;ve seen every spot that fits &mdash; here are the best ones again.
            </p>
          )}
          {isLastOfMatches && (
            <p className="text-center text-sm text-muted">
              That&rsquo;s the last of the matches for this search.
            </p>
          )}
          {sets.length > 1 && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Set {cursor + 1} of {sets.length}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {cursor > 0 && (
              <Button variant="outline" size="lg" onClick={showPrevious}>
                <ArrowLeft size={17} strokeWidth={2.25} />
                {RESULTS_COPY.previous}
              </Button>
            )}
            {(hasPool || canGoForward) && (
              <Button size="lg" onClick={showMore}>
                {RESULTS_COPY.showMore}
                <ArrowRight size={17} strokeWidth={2.25} />
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        Venue details and availability can change — double check before you go.
      </p>

    </main>
  );
}
