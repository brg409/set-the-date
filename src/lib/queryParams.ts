import type {
  DateFilters,
  DatePreferences,
  DateType,
  FoodDrinkActivity,
  IndoorOutdoorPreference,
  Neighborhood,
  PriceLevel,
  Vibe,
} from "./types";

const DATE_TYPES: DateType[] = [
  "first_date",
  "casual",
  "anniversary",
  "special_occasion",
  "reconnecting",
  "surprise_me",
];
const VIBES: Vibe[] = [
  "cozy_intimate",
  "relaxed_casual",
  "lively_social",
  "romantic",
  "fun_playful",
  "trendy",
  "something_different",
];
const NEIGHBORHOODS: Neighborhood[] = [
  "rittenhouse",
  "center_city",
  "old_city",
  "fishtown",
  "university_city",
  "south_philly",
];

export function preferencesToParams(prefs: DatePreferences): URLSearchParams {
  const params = new URLSearchParams();
  params.set("dateType", prefs.dateType);
  params.set("vibe", prefs.vibe);
  params.set("neighborhood", prefs.neighborhood);
  params.set("budget", String(prefs.budget));
  if (prefs.filters?.food) params.set("food", prefs.filters.food);
  if (prefs.filters?.indoorOutdoor) params.set("io", prefs.filters.indoorOutdoor);
  return params;
}

export function paramsToPreferences(
  params: URLSearchParams
): DatePreferences | null {
  const dateType = params.get("dateType") as DateType | null;
  const vibe = params.get("vibe") as Vibe | null;
  const neighborhood = params.get("neighborhood") as Neighborhood | null;
  const budgetRaw = params.get("budget");

  if (
    !dateType ||
    !DATE_TYPES.includes(dateType) ||
    !vibe ||
    !VIBES.includes(vibe) ||
    !neighborhood ||
    !NEIGHBORHOODS.includes(neighborhood) ||
    !budgetRaw
  ) {
    return null;
  }

  const budget = Number(budgetRaw) as PriceLevel;
  if (![1, 2, 3, 4].includes(budget)) return null;

  const filters: DateFilters = {};
  const food = params.get("food") as FoodDrinkActivity | null;
  if (food) filters.food = food;
  const io = params.get("io") as IndoorOutdoorPreference | null;
  if (io === "indoor" || io === "outdoor") filters.indoorOutdoor = io;

  return {
    dateType,
    vibe,
    neighborhood,
    budget,
    filters: Object.keys(filters).length ? filters : undefined,
  };
}
