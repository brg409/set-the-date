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
  // The first version of the app used "setthedate:", the rebrand "knowaplace:".
  local.setItem("setthedate:saved-venues", JSON.stringify(["beta", "omega"]));
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
  check("places saved under the original 'Set the Date' key are carried over too", snap.entries.omega?.wantToGo === true);
  check("a place in both old lists appears once", Object.keys(snap.entries).filter((k) => k === "beta").length === 1);
  check("migration persists the new key", local.getItem("knowaplace:my-places") !== null);
  check(
    "legacy keys are left untouched",
    local.getItem("knowaplace:saved-venues") !== null && local.getItem("setthedate:saved-venues") !== null
  );

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

  places.toggleWantToGo("kappa");
  places.toggleVisited("kappa");
  places.setRating("kappa", 4);
  places.setReview("kappa", "Great pasta");
  places.toggleFavorite("kappa");
  const k = places.getMyPlacesSnapshot().entries.kappa;
  check("a visited place keeps its rating, note and favorite together", k?.visited === true && k?.rating === 4 && k?.review === "Great pasta" && k?.favorite === true);
  places.toggleVisited("kappa");
  const k2 = places.getMyPlacesSnapshot().entries.kappa;
  check("un-marking Been Here does not throw away the rating or note", k2?.rating === 4 && k2?.review === "Great pasta");
  places.toggleFavorite("kappa");
  places.setRating("kappa", undefined);
  places.setReview("kappa", "");
  check("a place with nothing left on it is removed", places.getMyPlacesSnapshot().entries.kappa === undefined);
  places.toggleFavorite("lambda");
  check("a favorite alone is kept", places.getMyPlacesSnapshot().entries.lambda?.favorite === true);
  places.toggleFavorite("lambda");

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
    "rebuilt cards keep the engine's venues, order and scores",
    rebuilt.length === engine.length &&
      rebuilt.every((r, i) => r.venue.id === engine[i].venue.id && r.score === engine[i].score)
  );

  console.log("\nConcise explanations");
  const { generateWhyItFits, generateConciseWhyItFits } = await import("../src/lib/recommend");
  const { VENUES } = await import("../src/data/venues");
  const words = (s: string) => s.trim().split(/\s+/).length;
  check(
    "card text is the concise form of the engine's own explanation",
    rebuilt.every((r) => r.whyItFits === generateConciseWhyItFits(r.venue, prefs))
  );
  // Every occasion x vibe combination for every venue.
  const occasions = ["first_date", "casual", "anniversary", "special_occasion", "reconnecting", "surprise_me"] as const;
  const vibeList = ["cozy_intimate", "relaxed_casual", "lively_social", "romantic", "fun_playful", "trendy", "something_different"] as const;
  const counts: number[] = [];
  let notVerbatim = 0, defects = 0, calmNoise = 0, quietForLively = 0, noTags = 0;
  for (const v of VENUES) {
    for (const dateType of occasions) {
      for (const vibe of vibeList) {
        const p = { dateType, vibe, neighborhood: v.neighborhood, budget: v.priceLevel } as DatePreferences;
        const short = generateConciseWhyItFits(v, p);
        const full = generateWhyItFits(v, p);
        counts.push(words(short));
        for (const text of [short, full]) {
          // The tags after "What stands out:" must be the venue's own, word for word.
          const listed = text.match(/What stands out: (.*?)\.(?: |$)/);
          if (!listed) noTags++;
          else for (const tag of listed[1].split("; ")) if (!v.tags.some((t) => t === tag || t.includes(tag))) notVerbatim++;
          if (/ {2}|\.\.|;\./.test(text)) defects++;
        }
        if (["cozy_intimate", "romantic", "relaxed_casual"].includes(vibe) && /\b(loud|noisy|chaotic|shouting)\b/i.test(full)) calmNoise++;
        if (["lively_social", "fun_playful", "trendy"].includes(vibe) && /never has to compete/.test(full)) quietForLively++;
      }
    }
  }
  counts.sort((a, b) => a - b);
  const median = counts[Math.floor(counts.length / 2)];
  check(`every explanation lists the venue's own tags verbatim (${counts.length} combinations)`, notVerbatim === 0 && noTags === 0, `${notVerbatim} altered, ${noTags} without tags`);
  check(`card text is about 30-40 words (median ${median}, max ${counts[counts.length - 1]})`, median >= 33 && median <= 40 && counts[counts.length - 1] <= 40 && counts[0] >= 25);
  check("no explanation has a double space, double period, or dangling semicolon", defects === 0, `${defects} found`);
  check("a calm search (cozy, romantic, low-key) never cites noise or crowding as a plus", calmNoise === 0, `${calmNoise} found`);
  check("a lively search never says the room is quiet enough to talk", quietForLively === 0, `${quietForLively} found`);
  const surprise = generateWhyItFits(VENUES[0], { dateType: "surprise_me", vibe: "romantic", neighborhood: VENUES[0].neighborhood, budget: VENUES[0].priceLevel } as DatePreferences);
  check("a surprise-me search doesn't call anything a surprise-me date", !/surprise-me/.test(surprise));

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

  console.log("\nHomepage content");
  const home = await import("../src/lib/homeContent");
  const { DATE_TYPE_OPTIONS } = await import("../src/lib/options");
  const shown = home.venuesFromIds([...home.HERO_VENUE_IDS, ...home.FEATURED_VENUE_IDS]);
  check(
    "every hero and featured venue exists in the database",
    shown.length === home.HERO_VENUE_IDS.length + home.FEATURED_VENUE_IDS.length
  );
  check("every one has a Google place id (so a real photo can load)", shown.every((v) => Boolean(v.googlePlaceId)));
  check("every featured venue has an official website to link to", home.venuesFromIds(home.FEATURED_VENUE_IDS).every((v) => Boolean(v.websiteUrl)));
  check(
    "featured places are a restaurant, a cocktail bar, and an activity bar",
    home.venuesFromIds(home.FEATURED_VENUE_IDS).map((v) => v.id).join() ===
      "wm-mulherins-sons,franklin-mortgage-investment-co,barcade-fishtown"
  );
  check(
    "every quick-start occasion is an existing occasion option",
    home.QUICK_START_OCCASIONS.every((o) => DATE_TYPE_OPTIONS.some((opt) => opt.value === o))
  );
  const quickStartPrefill = home.QUICK_START_OCCASIONS.every(
    (o) => criteriaFromParams(new URLSearchParams(`dateType=${o}`)).dateType === o
  );
  check("each quick-start link pre-fills the Find screen's occasion", quickStartPrefill);

  check(
    "every shortened featured line is the start of that venue's own description",
    Object.entries(home.FEATURED_BLURBS).every(([id, blurb]) => {
      const v = VENUES.find((x) => x.id === id);
      return Boolean(v) && v!.description.startsWith(blurb.replace(/\.$/, ""));
    })
  );

  console.log("\nPlace pages");
  const { placeHref, parsePlaceContext, backTarget } = await import("../src/lib/placeLinks");
  const search = "dateType=first_date&vibe=cozy_intimate&neighborhood=rittenhouse&budget=3&io=outdoor";
  check("a place opened from results carries the exact search", placeHref("parc", { search }) === `/place/parc?${search}`);
  check("a place with no context has a plain link", placeHref("parc") === "/place/parc");
  const ctxSearch = parsePlaceContext(new URLSearchParams(search));
  check("a search in the link gives the 'Why we picked it for you' context", ctxSearch.prefs?.vibe === "cozy_intimate" && ctxSearch.prefs?.filters?.indoorOutdoor === "outdoor");
  check("Back goes to the very same results", backTarget(ctxSearch).href === `/results?${search}` && backTarget(ctxSearch).label === "Back to results");
  const ctxNone = parsePlaceContext(new URLSearchParams(""));
  check("no search means no context ('About this place')", ctxNone.prefs === null && backTarget(ctxNone).href === "/find");
  const ctxHome = parsePlaceContext(new URLSearchParams("from=home"));
  check("opened from the homepage: no context, Back goes home", ctxHome.prefs === null && backTarget(ctxHome).href === "/");
  const ctxMine = parsePlaceContext(new URLSearchParams(placeHref("parc", { search, from: "my-places" }).split("?")[1]));
  check("opened from My Places: Back goes to My Places and the saved search is kept", backTarget(ctxMine).href === "/my-places" && ctxMine.search === search);
  check("a garbage search is treated as no context", parsePlaceContext(new URLSearchParams("dateType=nope&vibe=x")).prefs === null);

  console.log("\nBooking links");
  const withRes = VENUES.filter((v) => v.reservationUrl);
  check("only venues with a stored reservation URL can show Reserve a Table", withRes.length > 0 && withRes.every((v) => /^https?:\/\//.test(v.reservationUrl as string)));
  check("every stored website and reservation link is a real http(s) URL", VENUES.every((v) => [v.websiteUrl, v.reservationUrl].every((u) => !u || /^https?:\/\/[^\s]+$/.test(u))));

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
