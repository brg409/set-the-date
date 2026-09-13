"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Utensils,
  Martini,
  Sparkles,
  Home,
  TreePine,
  Check,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { ProgressSteps } from "@/components/ProgressSteps";
import { SelectCard } from "@/components/SelectCard";
import {
  DATE_TYPE_OPTIONS,
  VIBE_OPTIONS,
  NEIGHBORHOOD_OPTIONS,
  BUDGET_OPTIONS,
} from "@/lib/options";
import { STEP_TITLES, STEP_SUBTITLES } from "@/lib/copy";
import { preferencesToParams, paramsToPreferences } from "@/lib/queryParams";
import type {
  DateType,
  Vibe,
  Neighborhood,
  PriceLevel,
  FoodDrinkActivity,
  IndoorOutdoorPreference,
} from "@/lib/types";

const STEPS = ["dateType", "vibe", "neighborhood", "budget"] as const;
type StepKey = (typeof STEPS)[number];

const ADVANCE_DELAY_MS = 280;

export default function PlanFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // If arriving from "Edit preferences", pre-fill the wizard with the last search.
  // Captured once via a lazy initializer (not a reactive useMemo): once the
  // wizard starts progressively syncing each step to the URL (see `syncUrl`
  // below), a brand-new walkthrough also ends up with all 4 fields in the
  // URL by step 4 — recomputing this from live searchParams would flip a
  // first-time search into "Editing your last search" by the last step.
  const [initial] = useState(() => paramsToPreferences(searchParams));
  // Editing an existing, fully-specified search (vs. starting fresh) lets us
  // jump straight to the field being changed and skip re-clicking through
  // the rest of the flow.
  const isEditing = Boolean(initial);
  const focusStep = searchParams.get("focus");
  const initialStep = focusStep && (STEPS as readonly string[]).includes(focusStep)
    ? STEPS.indexOf(focusStep as StepKey)
    : 0;

  const [step, setStep] = useState(initialStep);
  const [dateType, setDateType] = useState<DateType | undefined>(initial?.dateType);
  const [vibe, setVibe] = useState<Vibe | undefined>(initial?.vibe);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | undefined>(
    initial?.neighborhood
  );
  const [budget, setBudget] = useState<PriceLevel | undefined>(initial?.budget);
  const [food, setFood] = useState<FoodDrinkActivity | undefined>(
    initial?.filters?.food
  );
  const [indoorOutdoor, setIndoorOutdoor] = useState<IndoorOutdoorPreference | undefined>(
    initial?.filters?.indoorOutdoor
  );
  const [showMoreFilters, setShowMoreFilters] = useState(Boolean(initial?.filters));

  const stepKey: StepKey = STEPS[step];

  const canSubmit = Boolean(dateType && vibe && neighborhood && budget);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  /**
   * `router.push` (used below to mirror each choice into the URL) updates
   * history without firing `popstate` — only the browser's own Back/Forward
   * buttons do. So this listener is exactly "the user pressed Back/Forward,"
   * and re-derives every field plus which step to show from the URL that
   * navigation landed on. This is what makes Back restore the previous
   * step's selections instead of showing an empty step 1.
   */
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const dt = params.get("dateType") as DateType | null;
      const vb = params.get("vibe") as Vibe | null;
      const nb = params.get("neighborhood") as Neighborhood | null;
      const bgRaw = params.get("budget");
      const bg = bgRaw ? (Number(bgRaw) as PriceLevel) : undefined;
      setDateType(dt ?? undefined);
      setVibe(vb ?? undefined);
      setNeighborhood(nb ?? undefined);
      setBudget(bg);
      const filled = [dt, vb, nb, bg].filter(Boolean).length;
      setStep(Math.min(filled, STEPS.length - 1));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /**
   * Mirrors the in-progress selection into the URL on every step (not just
   * the final submit). Without this, the browser's Back button from
   * /results lands on whatever bare /plan URL the wizard started from —
   * with none of the choices just made, since local component state isn't
   * part of browser history. Pushing here means each step is its own
   * history entry carrying its own state, so Back naturally un-does one
   * step at a time instead of wiping everything.
   */
  function syncUrl(overrides: {
    dateType?: DateType;
    vibe?: Vibe;
    neighborhood?: Neighborhood;
    budget?: PriceLevel;
  }) {
    const next = {
      dateType: overrides.dateType ?? dateType,
      vibe: overrides.vibe ?? vibe,
      neighborhood: overrides.neighborhood ?? neighborhood,
      budget: overrides.budget ?? budget,
    };
    const params = new URLSearchParams();
    if (next.dateType) params.set("dateType", next.dateType);
    if (next.vibe) params.set("vibe", next.vibe);
    if (next.neighborhood) params.set("neighborhood", next.neighborhood);
    if (next.budget) params.set("budget", String(next.budget));
    router.push(`/plan?${params.toString()}`, { scroll: false });
  }

  function chooseDateType(value: DateType) {
    setDateType(value);
    syncUrl({ dateType: value });
    window.setTimeout(goNext, ADVANCE_DELAY_MS);
  }
  function chooseVibe(value: Vibe) {
    setVibe(value);
    syncUrl({ vibe: value });
    window.setTimeout(goNext, ADVANCE_DELAY_MS);
  }
  function chooseNeighborhood(value: Neighborhood) {
    setNeighborhood(value);
    syncUrl({ neighborhood: value });
    window.setTimeout(goNext, ADVANCE_DELAY_MS);
  }
  function chooseBudget(value: PriceLevel) {
    setBudget(value);
    syncUrl({ budget: value });
  }

  function handleSubmit() {
    if (!dateType || !vibe || !neighborhood || !budget) return;
    const params = preferencesToParams({
      dateType,
      vibe,
      neighborhood,
      budget,
      filters: { food, indoorOutdoor },
    });
    router.push(`/results?${params.toString()}`);
  }

  const title = STEP_TITLES[stepKey];
  const subtitle = STEP_SUBTITLES[stepKey];

  const progressLabel = useMemo(
    () => `Step ${step + 1} of ${STEPS.length}`,
    [step]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:py-12">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => (step === 0 ? router.push("/") : goBack())}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-navy/60 hover:text-navy"
          >
            <ArrowLeft size={15} strokeWidth={2.25} />
            Back
          </button>
          <ProgressSteps total={STEPS.length} current={step} />
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-navy/45">
            {progressLabel}
          </p>
        </div>

        {isEditing && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand/70 px-4 py-3">
            <p className="text-xs text-navy/70">
              Editing your last search — change what you need, then update.
            </p>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
              <Check size={14} strokeWidth={2.5} />
              Update results
            </Button>
          </div>
        )}

        <h1 className="font-display text-2xl text-navy sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm text-ink/60">{subtitle}</p>

        <div className="mt-7">
          {stepKey === "dateType" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DATE_TYPE_OPTIONS.map((opt) => (
                <SelectCard
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                  selected={dateType === opt.value}
                  onClick={() => chooseDateType(opt.value)}
                />
              ))}
            </div>
          )}

          {stepKey === "vibe" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {VIBE_OPTIONS.map((opt) => (
                <SelectCard
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                  selected={vibe === opt.value}
                  onClick={() => chooseVibe(opt.value)}
                />
              ))}
            </div>
          )}

          {stepKey === "neighborhood" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {NEIGHBORHOOD_OPTIONS.map((opt) => (
                <SelectCard
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                  selected={neighborhood === opt.value}
                  onClick={() => chooseNeighborhood(opt.value)}
                />
              ))}
            </div>
          )}

          {stepKey === "budget" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BUDGET_OPTIONS.map((opt) => (
                  <SelectCard
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    description={opt.description}
                    selected={budget === opt.value}
                    onClick={() => chooseBudget(opt.value)}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setShowMoreFilters((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium text-navy"
                >
                  Optional filters
                  <ChevronDown
                    size={16}
                    strokeWidth={2.25}
                    className={`transition-transform ${showMoreFilters ? "rotate-180" : ""}`}
                  />
                </button>
                {showMoreFilters && (
                  <div className="flex flex-col gap-4 border-t border-line px-4 py-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/50">
                        Food, drinks, or activity
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <FilterToggle
                          icon={Utensils}
                          label="Food"
                          active={food === "food"}
                          onClick={() => setFood(food === "food" ? undefined : "food")}
                        />
                        <FilterToggle
                          icon={Martini}
                          label="Drinks"
                          active={food === "drinks"}
                          onClick={() => setFood(food === "drinks" ? undefined : "drinks")}
                        />
                        <FilterToggle
                          icon={Sparkles}
                          label="Activity"
                          active={food === "activity"}
                          onClick={() => setFood(food === "activity" ? undefined : "activity")}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/50">
                        Indoor or outdoor
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <FilterToggle
                          icon={Home}
                          label="Indoor"
                          active={indoorOutdoor === "indoor"}
                          onClick={() =>
                            setIndoorOutdoor(indoorOutdoor === "indoor" ? undefined : "indoor")
                          }
                        />
                        <FilterToggle
                          icon={TreePine}
                          label="Outdoor"
                          active={indoorOutdoor === "outdoor"}
                          onClick={() =>
                            setIndoorOutdoor(indoorOutdoor === "outdoor" ? undefined : "outdoor")
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full"
              >
                {isEditing ? "Update results" : "Find my spot"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FilterToggle({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Utensils;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-coral bg-coral/10 text-coral-dark"
          : "border-line bg-white text-navy hover:border-navy/30"
      }`}
    >
      <Icon size={14} strokeWidth={2.25} />
      {label}
    </button>
  );
}
