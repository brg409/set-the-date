/**
 * Tests for the KnowaPlace V2 UI logic that sits around the (untouched)
 * recommendation engine: the My Places store, Find-screen pre-fill
 * parsing, and the results "sets" behind Show Me 3 More.
 *
 * Run with: npm run test:ui-logic
 */

// Minimal browser-storage shim, installed BEFORE the app modules load so
// their `typeof window` guards take the browser path.
function makeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    _map: m,
  };
}
const local = makeStorage();
const session = makeStorage();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: local,
  sessionStorage: session,
  addEventListener: () => {},
  removeEventListener: () => {},
};

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

async function main() {
  // Legacy saved ids must exist BEFORE the store is first read.
  local.setItem("knowaplace:saved-venues", JSON.stringify(["alpha", "beta"]));

  const places = await import("../src/lib/myPlaces");
  const { sanitizeCriteria, criteriaFromParams, hasAnyCriteria } = await import("../src/lib/criteria");
  const { getRecommendations } = await import("../src/lib/recommend");
  const { hydrateSet, nextSet, freshSession, NO_EXPANSION } = await import("../src/lib/resultSession");
  type DatePreferences = import("../src/lib/types").DatePreferences;

  console.log("\nMy Places store");
  const snap = places.getMyPlacesSnapshot();
  check(
    "legacy saved ids migrate to Want to Go",
    snap.entries.alpha?.wantToGo === true && snap.entries.beta?.wantToGo === true
  );
  check("migration persists the new key", local.getItem("knowaplace:my-places") !== null);
  check("legacy key is left untouched", local.getItem("knowaplace:saved-venues") !== null);

  places.toggleWantToGo("gamma", "dateType=first_date");
  check("saving adds to Want to Go", places.getMyPlacesSnapshot().entries.gamma?.wantToGo === true);
  check(
    "saving records the search it came from",
    places.getMyPlacesSnapshot().entries.gamma?.fromSearch === "dateType=first_date"
  );
  places.toggleWantToGo("gamma");
  check("unsaving the only flag removes the entry", places.getMyPlacesSnapshot().entries.gamma === undefined);

  places.toggleWantToGo("delta");
  places.toggleVisited("delta");
  const d = places.getMyPlacesSnapshot().entries.delta;
  check("Been Here marks visited and moves it out of Want to Go", d?.visited === true && d?.wantToGo === false);
  places.toggleVisited("delta");
  check("un-marking Been Here removes the empty entry", places.getMyPlacesSnapshot().entries.delta === undefined);

  places.setRating("eps", 9);
  check("rating is clamped to 5", places.getMyPlacesSnapshot().entries.eps?.rating === 5);
  places.setRating("eps", 0);
  check("rating is clamped to 1", places.getMyPlacesSnapshot().entries.eps?.rating === 1);
  places.setRating("eps", undefined);
  check("clearing the only value removes the entry", places.getMyPlacesSnapshot().entries.eps === undefined);

  places.setReview("zeta", "  great  ");
  check("review is trimmed", places.getMyPlacesSnapshot().entries.zeta?.review === "great");
  places.setReview("zeta", "x".repeat(900));
  check("review is capped at 500 characters", places.getMyPlacesSnapshot().entries.zeta?.review?.length === 500);
  places.setReview("zeta", "   ");
  check("blank review clears it", places.getMyPlacesSnapshot().entries.zeta === undefined);

  check(
    "state survives a reload (persisted JSON round-trips)",
    (() => {
      const raw = local.getItem("knowaplace:my-places");
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.entries?.alpha?.wantToGo === true;
    })()
  );

  console.log("\nFind screen criteria");
  const bad = sanitizeCriteria({ dateType: "nope", vibe: "romantic", neighborhood: "mars", budget: "9" });
  check("invalid values are dropped, valid ones kept", bad.vibe === "romantic" && !bad.dateType && !bad.neighborhood && !bad.budget);
  const fromUrl = criteriaFromParams(
    new URLSearchParams("dateType=first_date&vibe=cozy_intimate&neighborhood=fishtown&budget=3&food=drinks&io=outdoor")
  );
  check(
    "URL params (including food and io) pre-fill every field",
    fromUrl.dateType === "first_date" &&
      fromUrl.vibe === "cozy_intimate" &&
      fromUrl.neighborhood === "fishtown" &&
      fromUrl.budget === 3 &&
      fromUrl.food === "drinks" &&
      fromUrl.indoorOutdoor === "outdoor"
  );
  check("a partial old /plan link still pre-fills what it has", criteriaFromParams(new URLSearchParams("vibe=trendy")).vibe === "trendy");
  check("empty selection reports no criteria", !hasAnyCriteria({}));

  console.log("\nResults sets (Show Me 3 More)");
  const prefs = { dateType: "casual", vibe: "relaxed_casual", neighborhood: "rittenhouse", budget: 3 } as const;
  const first = freshSession(prefs);
  check("first set is exactly the engine's three", first.sets[0].join() === getRecommendations(prefs).results.map((r) => r.venue.id).join());

  const rebuilt = hydrateSet(first.sets[0], prefs);
  const engine = getRecommendations(prefs).results;
  check(
    "rebuilt cards match the engine's scores and copy exactly",
    rebuilt.length === engine.length &&
      rebuilt.every((r, i) => r.venue.id === engine[i].venue.id && r.score === engine[i].score && r.whyItFits === engine[i].whyItFits)
  );

  const seen: string[] = [...first.sets[0]];
  let repeats = false;
  for (let i = 0; i < 3; i++) {
    const ids = nextSet(prefs, NO_EXPANSION, seen);
    if (ids.some((id) => seen.includes(id))) repeats = true;
    seen.push(...ids);
  }
  check("three successive sets never repeat a venue while fresh ones remain", !repeats && new Set(seen).size === seen.length);

  // Find a search whose eligible pool is 4 or 5 venues, so exactly 1-2 are
  // left over after the first set of three (the engine alone would restart).
  const hoods = ["rittenhouse", "center_city", "old_city", "fishtown", "university_city", "south_philly"] as const;
  const foods = [undefined, "food", "drinks", "activity"] as const;
  const ios = [undefined, "indoor", "outdoor"] as const;
  let thin: DatePreferences | null = null;
  let poolSize = 0;
  outer: for (const neighborhood of hoods) {
    for (const budget of [1, 2, 3, 4] as const) {
      for (const food of foods) {
        for (const io of ios) {
          const p: DatePreferences = {
            dateType: "casual",
            vibe: "relaxed_casual",
            neighborhood,
            budget,
            filters: food || io ? { food, indoorOutdoor: io } : undefined,
          };
          const n = getRecommendations(p).exactMatchCount;
          if (n === 4 || n === 5) {
            thin = p;
            poolSize = n;
            break outer;
          }
        }
      }
    }
  }
  if (thin) {
    const s1 = freshSession(thin).sets[0];
    const s2 = nextSet(thin, NO_EXPANSION, s1);
    check(
      `with ${poolSize} eligible venues, the second set is only the ${poolSize - 3} leftover(s), not a repeat`,
      s2.length === poolSize - 3 && s2.every((id) => !s1.includes(id)),
      `${s1.join(",")} -> ${s2.join(",")}`
    );
    const s3 = nextSet(thin, NO_EXPANSION, [...s1, ...s2]);
    check("once everything has been seen it restarts with valid venues", s3.length > 0);
  } else {
    check("found a 4-5 venue search to test leftovers", false, "none found");
  }

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
