"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Utensils, Martini, Sparkles, Home, TreePine } from "lucide-react";
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
  IndoorOutdoor,
} from "@/lib/types";

const STEPS = ["dateType", "vibe", "neighborhood", "budget"] as const;
type StepKey = (typeof STEPS)[number];

const ADVANCE_DELAY_MS = 280;

export default function PlanFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // If arriving from "Adjust filters", pre-fill the wizard with the last search.
  const initial = useMemo(() => paramsToPreferences(searchParams), [searchParams]);

  const [step, setStep] = useState(0);
  const [dateType, setDateType] = useState<DateType | undefined>(initial?.dateType);
  const [vibe, setVibe] = useState<Vibe | undefined>(initial?.vibe);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | undefined>(
    initial?.neighborhood
  );
  const [budget, setBudget] = useState<PriceLevel | undefined>(initial?.budget);
  const [food, setFood] = useState<FoodDrinkActivity | undefined>(
    initial?.filters?.food
  );
  const [indoorOutdoor, setIndoorOutdoor] = useState<IndoorOutdoor | undefined>(
    initial?.filters?.indoorOutdoor
  );
  const [showMoreFilters, setShowMoreFilters] = useState(Boolean(initial?.filters));

  const stepKey: StepKey = STEPS[step];

  const canSubmit = Boolean(dateType && vibe && neighborhood && budget);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  function selectAndAdvance<T>(setter: (v: T) => void, value: T) {
    setter(value);
    window.setTimeout(goNext, ADVANCE_DELAY_MS);
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
                  onClick={() => selectAndAdvance(setDateType, opt.value)}
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
                  onClick={() => selectAndAdvance(setVibe, opt.value)}
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
                  onClick={() => selectAndAdvance(setNeighborhood, opt.value)}
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
                    onClick={() => setBudget(opt.value)}
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
                Find my spot
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
