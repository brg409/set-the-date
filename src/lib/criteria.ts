import {
  BUDGET_OPTIONS,
  DATE_TYPE_OPTIONS,
  NEIGHBORHOOD_OPTIONS,
  VIBE_OPTIONS,
} from "./options";
import type {
  DateType,
  FoodDrinkActivity,
  IndoorOutdoorPreference,
  Neighborhood,
  PriceLevel,
  Vibe,
} from "./types";

/**
 * The Find screen's in-progress selections. Every field is optional because
 * a search isn't submittable until the four required ones are chosen. The
 * value sets are exactly the existing preference categories — nothing here
 * adds, renames, or removes a category.
 */
export interface Criteria {
  dateType?: DateType;
  vibe?: Vibe;
  neighborhood?: Neighborhood;
  budget?: PriceLevel;
  food?: FoodDrinkActivity;
  indoorOutdoor?: IndoorOutdoorPreference;
}

const STORAGE_KEY = "knowaplace:criteria";

const DATE_TYPES = DATE_TYPE_OPTIONS.map((o) => o.value as string);
const VIBES = VIBE_OPTIONS.map((o) => o.value as string);
const NEIGHBORHOODS = NEIGHBORHOOD_OPTIONS.map((o) => o.value as string);
const BUDGETS = BUDGET_OPTIONS.map((o) => String(o.value));
const FOODS = ["food", "drinks", "activity"];
const IO = ["indoor", "outdoor"];

/** Validates each field independently, so a partial or stale URL still pre-fills what it can. */
export function sanitizeCriteria(input: Record<string, unknown>): Criteria {
  const out: Criteria = {};
  const dt = input.dateType;
  if (typeof dt === "string" && DATE_TYPES.includes(dt)) out.dateType = dt as DateType;
  const vb = input.vibe;
  if (typeof vb === "string" && VIBES.includes(vb)) out.vibe = vb as Vibe;
  const nb = input.neighborhood;
  if (typeof nb === "string" && NEIGHBORHOODS.includes(nb)) out.neighborhood = nb as Neighborhood;
  const bg = input.budget;
  if ((typeof bg === "string" || typeof bg === "number") && BUDGETS.includes(String(bg))) {
    out.budget = Number(bg) as PriceLevel;
  }
  const food = input.food;
  if (typeof food === "string" && FOODS.includes(food)) out.food = food as FoodDrinkActivity;
  const io = input.indoorOutdoor;
  if (typeof io === "string" && IO.includes(io)) out.indoorOutdoor = io as IndoorOutdoorPreference;
  return out;
}

/** Reads the same URL parameter names `queryParams.ts` writes (`io` is the indoor/outdoor key). */
export function criteriaFromParams(params: URLSearchParams): Criteria {
  return sanitizeCriteria({
    dateType: params.get("dateType"),
    vibe: params.get("vibe"),
    neighborhood: params.get("neighborhood"),
    budget: params.get("budget"),
    food: params.get("food"),
    indoorOutdoor: params.get("io"),
  });
}

export function hasAnyCriteria(c: Criteria): boolean {
  return Object.values(c).some((v) => v !== undefined);
}

export function loadCriteria(): Criteria {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeCriteria(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function saveCriteria(c: Criteria): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // Storage unavailable: selections just won't survive a tab switch.
  }
}
