"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarHeart,
  ChevronDown,
  DollarSign,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/Button";
import {
  BUDGET_OPTIONS,
  DATE_TYPE_OPTIONS,
  NEIGHBORHOOD_OPTIONS,
  VIBE_OPTIONS,
} from "@/lib/options";
import {
  criteriaFromParams,
  hasAnyCriteria,
  loadCriteria,
  saveCriteria,
  type Criteria,
} from "@/lib/criteria";
import { preferencesToParams } from "@/lib/queryParams";
import { useIsClient } from "@/hooks/useIsClient";
import { FIND_COPY } from "@/lib/copy";

/**
 * Screen 1 of Find. The shell renders a static placeholder until the client
 * is ready so the form's initial state (URL params, else the last
 * selections kept for this tab) can be read synchronously without a
 * hydration mismatch.
 */
export default function FindScreen() {
  const isClient = useIsClient();
  return isClient ? <FindForm /> : <FindSkeleton />;
}

function Heading() {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
        {FIND_COPY.heading}
      </h1>
      <p className="mt-1.5 text-base text-muted">{FIND_COPY.subheading}</p>
    </div>
  );
}

function FindSkeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-12 pt-7">
      <Heading />
      <div className="mt-6 flex flex-col gap-4" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-tint" />
        ))}
      </div>
    </main>
  );
}

function FindForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [criteria, setCriteria] = useState<Criteria>(() => {
    const fromUrl = criteriaFromParams(new URLSearchParams(searchParams.toString()));
    return hasAnyCriteria(fromUrl) ? fromUrl : loadCriteria();
  });
  const [moreOpen, setMoreOpen] = useState(() =>
    Boolean(criteria.food || criteria.indoorOutdoor)
  );

  // Keep selections for this tab session so switching tabs and coming back
  // (or returning from results) never starts over.
  useEffect(() => {
    saveCriteria(criteria);
  }, [criteria]);

  function toggle<K extends keyof Criteria>(key: K, value: Criteria[K]) {
    setCriteria((c) => ({ ...c, [key]: c[key] === value ? undefined : value }));
  }

  const { dateType, vibe, neighborhood, budget, food, indoorOutdoor } = criteria;
  const complete = Boolean(dateType && vibe && neighborhood && budget);
  const moreCount = [food, indoorOutdoor].filter(Boolean).length;

  const missing = [
    !dateType && "an occasion",
    !vibe && "a vibe",
    !neighborhood && "a neighborhood",
    !budget && "a budget",
  ].filter((m): m is string => Boolean(m));

  function findPlaces() {
    if (!dateType || !vibe || !neighborhood || !budget) return;
    const params = preferencesToParams({
      dateType,
      vibe,
      neighborhood,
      budget,
      filters: food || indoorOutdoor ? { food, indoorOutdoor } : undefined,
    });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-44 pt-7 md:pb-12">
      <div className="flex items-start justify-between gap-4">
        <Heading />
        {hasAnyCriteria(criteria) && (
          <button
            type="button"
            onClick={() => {
              setCriteria({});
              setMoreOpen(false);
            }}
            className="mt-2 shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Group icon={CalendarHeart} title="Occasion">
          {DATE_TYPE_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.value}
              selected={dateType === opt.value}
              onClick={() => toggle("dateType", opt.value)}
            >
              {opt.label}
            </OptionChip>
          ))}
        </Group>

        <Group icon={Sparkles} title="Vibe">
          {VIBE_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.value}
              selected={vibe === opt.value}
              onClick={() => toggle("vibe", opt.value)}
            >
              {opt.label}
            </OptionChip>
          ))}
        </Group>

        <Group icon={MapPin} title="Neighborhood">
          {NEIGHBORHOOD_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.value}
              selected={neighborhood === opt.value}
              onClick={() => toggle("neighborhood", opt.value)}
            >
              {opt.label}
            </OptionChip>
          ))}
        </Group>

        <Group icon={DollarSign} title="Budget">
          {BUDGET_OPTIONS.map((opt) => (
            <OptionChip
              key={opt.value}
              selected={budget === opt.value}
              onClick={() => toggle("budget", opt.value)}
            >
              <span className="font-semibold">{opt.label}</span>{" "}
              <span className="ml-1 hidden text-xs opacity-80 sm:inline">
                {opt.description}
              </span>
            </OptionChip>
          ))}
        </Group>

        <section className="rounded-3xl border border-line bg-card">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tint text-primary">
                <SlidersHorizontal size={16} strokeWidth={2.25} />
              </span>
              More Filters
              {moreCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                  {moreCount}
                </span>
              )}
            </span>
            <ChevronDown
              size={18}
              strokeWidth={2.25}
              className={`text-muted transition-transform ${moreOpen ? "rotate-180" : ""}`}
            />
          </button>
          {moreOpen && (
            <div className="flex flex-col gap-4 border-t border-line px-4 py-4 sm:px-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Food, drinks, or activity
                </p>
                <div className="flex flex-wrap gap-2">
                  <OptionChip selected={food === "food"} onClick={() => toggle("food", "food")}>
                    Food
                  </OptionChip>
                  <OptionChip selected={food === "drinks"} onClick={() => toggle("food", "drinks")}>
                    Drinks
                  </OptionChip>
                  <OptionChip
                    selected={food === "activity"}
                    onClick={() => toggle("food", "activity")}
                  >
                    Activity
                  </OptionChip>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Indoor or outdoor
                </p>
                <div className="flex flex-wrap gap-2">
                  <OptionChip
                    selected={indoorOutdoor === "indoor"}
                    onClick={() => toggle("indoorOutdoor", "indoor")}
                  >
                    Indoor
                  </OptionChip>
                  <OptionChip
                    selected={indoorOutdoor === "outdoor"}
                    onClick={() => toggle("indoorOutdoor", "outdoor")}
                  >
                    Outdoor
                  </OptionChip>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Phones: pinned just above the tab bar so the primary action is
          always reachable. Desktop: sits inline under the form. */}
      <div className="fixed inset-x-0 bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom))] z-30 border-t border-line/70 bg-page/95 px-5 pb-3 pt-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto max-w-2xl">
          {!complete && (
            <p className="mb-2 text-center text-xs text-muted" aria-live="polite">
              Choose {missing.join(", ")} to continue.
            </p>
          )}
          <Button size="lg" className="w-full" disabled={!complete} onClick={findPlaces}>
            {FIND_COPY.cta}
            <ArrowRight size={18} strokeWidth={2.25} />
          </Button>
        </div>
      </div>
    </main>
  );
}

function Group({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-line bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tint text-primary">
          <Icon size={16} strokeWidth={2.25} />
        </span>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function OptionChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex min-h-10 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-line bg-card text-ink hover:border-primary/40 hover:bg-tint"
      }`}
    >
      {children}
    </button>
  );
}
