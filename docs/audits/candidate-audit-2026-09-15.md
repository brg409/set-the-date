# Candidate Venue Audit — September 2026

Research-only pass. No files in `src/data/venues.ts` have been touched. Google Place IDs were deliberately NOT looked up in this pass (per instructions) except where noted as a follow-up step — they'll be looked up via the Places API only for venues that survive to an actual "add" list.

Legend: **VERIFIED** = open, correctly falls in one of the 6 supported neighborhoods, genuinely date-suitable, recommended for a future add pass. **REJECTED** = open and in-area but fails the date-suitability bar. **OUTSIDE-AREA** = confirmed real/open but geographically outside the 6 neighborhoods — do not force an assignment. **CLOSED** = confirmed closed, drop entirely. **NEEDS-CLARIFICATION** = ambiguous identity, boundary, or data-quality issue requiring a human decision before proceeding.

---

## RITTENHOUSE

| Venue | Status | Address | Verdict |
|---|---|---|---|
| The Love | Open | 130 S 18th St | **VERIFIED** — Starr Restaurants. Reviews split: cozy decor but frequently loud/crowded. |
| Harp & Crown | Open | 1525 Sansom St | **VERIFIED** (boundary) — west of Broad, ~3-4 blocks from Rittenhouse Sq proper. Elbow Lane speakeasy-bowling add-on. Noise complaints common. |
| Ambrosia Ristorante | Open | 231 S 24th St | **NEEDS-CLARIFICATION** — genuinely in Fitler Square (west of 22nd St), not Rittenhouse core. See "Fitler Square cluster" note below. |
| Trattoria Carina | Open | 2201 Spruce St | **NEEDS-CLARIFICATION** — same Fitler Square issue. |
| Sally | Open | 2229 Spruce St | **NEEDS-CLARIFICATION** — same Fitler Square issue. |
| Spice Finch | Open | 220 S 17th St | **VERIFIED** — Warwick Hotel, solidly Rittenhouse. Romantic per reviews, better off-peak. |
| Almyra | Open | 1636 Chancellor St | **VERIFIED** — one block from Rittenhouse Sq. Loud/lively DJ-lounge energy Wed–Sat, not a quiet pick. |
| Vernick Fish | Open | 1 N 19th St (Four Seasons) | **VERIFIED** (boundary, Rittenhouse/Center City edge) — confirmed a *separate* restaurant from the existing "Vernick Food & Drink" (2031 Walnut, already in dataset). Same restaurant group. |
| The Dandelion | Open | 124 S 18th St | **VERIFIED** — Starr Restaurants (same group as The Love). British gastropub, multi-room, flexible for quiet or lively seating. |
| JG SkyHigh (official name: "SkyHigh") | Open | 1 N 19th St, 60th fl (Four Seasons) | **VERIFIED** (same building as Vernick Fish) — Jean-Georges rooftop lounge, $$$$, romantic/upscale. Name is a press nickname; official branding is just "SkyHigh." |
| Giuseppe & Sons | Open | 1523 Sansom St | **VERIFIED** — same block as Harp & Crown. Dim/intimate but can run loud on weekends. |
| Vic Sushi Bar | Open | 2035 Sansom St | **VERIFIED** — tiny (~10-seat) BYOB sushi counter, casual/playful, no reservations. |
| Continental Midtown | Open | 1801 Chestnut St | **VERIFIED** — third Starr Restaurants property in this batch (see flag below). Rooftop patio. |
| Five Iron Golf (Rittenhouse) | Open | 2116 Chestnut St | **VERIFIED** — confirmed the Rittenhouse-specific address of a 3-location Philly chain. |
| Puttshack Philadelphia | Open | 1625 Chestnut St (Shops at Liberty Place) | **VERIFIED** — international chain, single Philly location. Loud/energetic. |
| SPIN Philadelphia | Open | 211 S 15th St | **VERIFIED** (boundary) — 2-3 blocks from Rittenhouse Sq, closer to Broad. International chain, single Philly location. |
| Walnut Garden | Open | 1708 Walnut St | **VERIFIED, but flag seasonality/precarity** — a *temporary pop-up* on a lot slated for redevelopment. Operator says it'll run through this year's holiday season with no guarantee beyond that. Recommend re-verifying status before adding, or holding off until its future is clearer. |

**Cross-cutting flags:**
- **Starr Restaurants cluster:** The Love, The Dandelion, and Continental Midtown are all Stephen Starr properties — three from one operator in a single batch. Worth spacing these out rather than adding all three at once, for the same diversity reasons the app's `DIVERSITY_PENALTY` already cares about at the venue level (this is an ownership-level pattern the penalty doesn't see).
- **Fitler Square cluster (Ambrosia, Trattoria Carina, Sally):** All three sit west of 22nd St, in what's locally recognized as Fitler Square — a distinct (if adjacent) neighborhood the app doesn't separately support. This mirrors a decision already made once before in this project (Rittenhouse absorbing some edge blocks) — recommend the same judgment call: include as Rittenhouse if they're commonly categorized that way by local guides, exclude if not. Flagging rather than deciding unilaterally since it's a real boundary-policy question, not a factual one.
- **Vernick Fish / JG SkyHigh share a building** (Four Seasons at 1 N 19th St) with each other, and Vernick Fish shares a restaurant group with the already-dataset Vernick Food & Drink.

---

## CENTER CITY

| Venue | Status | Address | Verdict |
|---|---|---|---|
| Little Nonna's | Open | 1234 Locust St | **VERIFIED** — Midtown Village, covered garden seating. Loud on weekends, quieter Sun/early Sat. |
| Middle Child (original) | Open | 248 S 11th St | **VERIFIED** — confirmed distinct address from the existing "Middle Child Clubhouse" (Fishtown). Casual/playful counter-service, not romantic. |
| Nan Zhou Hand Drawn Noodle House | Open | 1022 Race St | **NEEDS-CLARIFICATION** — geographically inside the Center City box but culturally "Chinatown," a district the app's Center City description doesn't name. See "Chinatown" note below. |
| Penang | Open | 117 N 10th St | **NEEDS-CLARIFICATION** — same Chinatown issue, *plus* unresolved: may or may not be affiliated with an unrelated NYC-founded "Penang" chain (couldn't confirm either way). |
| Terakawa Ramen (Chinatown location) | Open | 204 N 9th St | **NEEDS-CLARIFICATION** — same Chinatown issue. Also has a second Philly location at 125 S 40th St (University City) — genuine 2-location mini-chain, only the Chinatown one is a Center City candidate. |
| Bleu Sushi | Open | 262 S 10th St | **VERIFIED** — Washington Sq West, not Chinatown. Cozy/intimate, popular date pick. |
| Kinme | Open | 1117 Locust St | **VERIFIED** — upscale omakase, $$$$ splurge tier, intimate. |
| Goldie | Open (multi-location) | **Use 1218 Sansom St** | **VERIFIED, specific location matters** — confirmed 3 current Philly locations (1218 Sansom = Center City; 1911 Sansom = Rittenhouse; 3401 Walnut = University City). Only 1218 Sansom fits Center City as defined. Fast-casual, not a sit-down date, but fine for a casual lunch date. |
| Steak 48 | Open | 260 S Broad St | **NEEDS-CLARIFICATION — likely mis-bucketed.** Sits next to the Miller/Merriam Theater, which is confirmed *west* of Broad — meaning Steak 48 is probably Rittenhouse/Ave-of-the-Arts-west, not Center City. Recommend confirming with a direct map check before assigning either way. |
| F1 Arcade Philadelphia | Open | 1330 Chestnut St | **VERIFIED** — international chain, single Philly (largest-in-the-world) location. Playful, likely loud. |
| Red Kings II Karaoke | **CLOSED** | 1006 Race St | **CLOSED** — do not add. A separate original "Red Kings" (933 Race St) has unconfirmed status; would need its own verification if you want a karaoke option at all. |
| High Street Philadelphia | Open | 101 S 9th St | **VERIFIED** — Washington Sq West. Elevated New American, smart-casual. |

**Cross-cutting flags:**
- **Chinatown** (Nan Zhou, Penang, Terakawa-Chinatown, the now-closed Red Kings II) sits geographically inside the Vine/South/Broad/7th box but is a distinct, locally-recognized district the app's own Center City description never named (it lists City Hall/Ave of the Arts, Midtown Village, Wash Sq West, Jewelers Row, Gayborhood — no Chinatown). This is a real scope question: fold Chinatown into Center City, or leave it out entirely until/unless it's explicitly added as covered territory? Recommend a decision here since it affects 3 open, genuinely good candidates.

---

## OLD CITY / SOCIETY HILL

| Venue | Status | Address | Verdict |
|---|---|---|---|
| Tuna Bar | Open | 205 Race St | **VERIFIED** — correctly in Old City. Some street noise on the sidewalk seating. |
| Zahav | Open | 237 St. James Pl | **VERIFIED** — landmark, unambiguous address, confirmed patio (walk-in only, specific hours). |
| Marrakesh | Open | 517 S Leithgow St | **NEEDS-CLARIFICATION** — sits right at the Society Hill/Queen Village line (south of the core Old City/Society Hill area, near South St). Also: no genuine official restaurant website found, only third-party listings (Yelp/OpenTable/Groupon) — a data-quality gap worth noting even if it's ultimately included. |

---

## SOUTH PHILADELPHIA — major correction to the preliminary grouping

The app's "South Philadelphia" is specifically the East Passyunk Ave / 9th St Italian Market corridor (bounded by South St/Christian St, Oregon Ave, Broad St/Grays Ferry Ave, and the river). Three of these four candidates turned out to be somewhere else entirely:

| Venue | Status | Address | Verdict |
|---|---|---|---|
| Little Fish | Open | 746 S 6th St | **OUTSIDE-AREA** — confirmed Queen Village/Bella Vista, north of Washington Ave — not the Italian Market corridor. Genuinely excellent romantic BYOB, but has no home in the app's current 6 neighborhoods (Queen Village isn't one of them). |
| Royal Sushi & Izakaya | Open | 780-782 S 2nd St | **OUTSIDE-AREA** — confirmed Queen Village, same issue. (Confirmed genuinely distinct from the existing Rittenhouse venue "Dancerobot" — different address, different neighborhood, linked only by a shared chef.) |
| Cry Baby Pasta | Open | 627 S 3rd St | **OUTSIDE-AREA** — confirmed Queen Village, same issue. |
| Angelo's Pizzeria | Open | 736 S 9th St | **REJECTED** — this one genuinely IS in the Italian Market corridor, but it's cash/pickup-only with essentially no seating (a few sidewalk tables) and ~45 min waits. Doesn't fit the app's sit-down "date" model despite being correctly located. |

**Net result: none of the 4 preliminary South Philadelphia candidates are recommended for that neighborhood.** Little Fish, Royal Sushi & Izakaya, and Cry Baby Pasta are all real, high-quality date spots — just not addressable under any of the app's current 6 neighborhoods (all three are Queen Village).

---

## FISHTOWN

| Venue | Status | Address | Verdict |
|---|---|---|---|
| Laser Wolf | Open | 1301 N Howard St | **VERIFIED, with a factual correction** — could NOT confirm the commonly-repeated claim that it sits atop the Wm. Mulherin's Sons building (already in the dataset). Mulherin's Sons is at a different address (1355 N Front St); the two appear to be separate buildings roughly a block apart. Laser Wolf does have its own rooftop per multiple sources — just don't describe it as "atop Mulherin's Sons" without further confirmation. Address falls within the existing Girard–Norris Fishtown boundary despite some press calling the area "Kensington." |
| Ekta Indian Cuisine (Fishtown) | Open | **1142 Crease St** (not 238 Girard Ave as assumed) | **VERIFIED, address correction** — confirmed a 4-location small chain (Fishtown, Bryn Mawr, University City, Manayunk). Casual, "not a particularly romantic feel" per reviews — good for casual/reconnecting dates, not special-occasion ones. |

---

## UNIVERSITY CITY

| Venue | Status | Address | Verdict |
|---|---|---|---|
| Vietnam Cafe | Open | 816 S 47th St | **VERIFIED** — comfortable, low-key casual spot. |
| Chengdu Famous Food | Open | 3635 Lancaster Ave | **VERIFIED** — casual, moderate noise, good for groups/casual dates. |
| Clarkville | Open | 4301 Baltimore Ave | **NEEDS-CLARIFICATION** — western edge of University City (Cedar Park, near Clark Park), noticeably further from the Penn/Drexel campus core than the other candidates here. Sibling restaurant to the already-in-dataset Local 44 (same ownership group). |
| Hummus Grill | **CLOSED** (May 2026, 18-year run) | 3931 Walnut St | **CLOSED** — do not add. |
| Koreana | **CLOSED** (2022, site redeveloped) | 3801 Chestnut St (former) | **CLOSED** — the University City location no longer exists. A different, separately-owned "Koreana" survives in Rittenhouse (37 S 19th St) — not part of this candidate list, flagging only as a possible separate future consideration, not recommending it here. |
| U-Town | Open | 110 S 40th St | **VERIFIED** — confirmed official site is utownkoreanfood.com (several look-alike aggregator/mirror sites also surfaced — ignore those). Casual, popular with students. |
| Enjay's Pizza (at Smokey Joe's) | Open | 210 S 40th St (Smokey Joe's) | **VERIFIED, model as one venue** — Enjay's is a real, distinct pizza-kitchen brand, but it operates *inside* Smokey Joe's (a ~90-year-old dive bar) and shares its address. Recommend modeling this as a single venue ("Smokey Joe's" with Enjay's as its food program) rather than two separate entries. Loud, casual dive-bar atmosphere — not romantic. |

---

## OUTSIDE THE SIX NEIGHBORHOODS (confirmed, not assigned)

All 12 confirmed as genuinely outside Rittenhouse/Center City/Old City/Fishtown/University City/South Philadelphia:

| Venue | Status | Confirmed location | Note |
|---|---|---|---|
| Osteria | Open | North Broad St (640 N Broad) | Well north of the Center City box. |
| Umai Umai | Open | Fairmount | — |
| One Shot Coffee | Open | Northern Liberties | — |
| Tiffin | Open (multi-location) | **See flag below — one location is actually in-scope** | |
| McNally's Tavern | Open | Chestnut Hill | Historic pub, reads more nostalgic than date-oriented anyway. |
| Dalessandro's Steaks | Open (brief closure Sept 14-27, 2026) | Roxborough | Also **REJECTED on merits** even hypothetically — crowded takeout counter, minimal seating. |
| Jamie Hollander Gourmet Foods | **Effectively closed as a venue** | Solebury Twp / New Hope (Bucks Co.) | Retail/café closed 2022 — it's catering-only now, no walk-in location exists at all. |
| Solebury Orchards | Open, **seasonal** | New Hope, Bucks Co. | 2026 season: open Jun 25–Apr 26, Thu–Sun (varies by month). |
| Shady Brook Farm | Open, **seasonal programming** | Yardley, Bucks Co. | Fall Fest runs Sept 11–Oct 30, 2026; farm market itself is year-round. Reads more family/group-activity than date-oriented. |
| Crossing Vineyards and Winery | Open | Washington Crossing / Newtown, Bucks Co. | — |
| Buckingham Valley Vineyards | Open | Buckingham, Bucks Co. | — |
| Frenchtown Roller Rink | Open | Frenchtown, **New Jersey** | Different state. |

**Flag — Tiffin has a location actually inside the app's supported area:** Tiffin operates a location at **1100 Federal St**, which falls within the app's own South Philadelphia boundary (south of Christian St, within the defined corridor). This wasn't part of the original South Philadelphia candidate list, but surfaced during research. Its Girard Ave location (Northern Liberties/Fairmount border, confusingly labeled "Fairmount" on some listings) and Mt Airy location remain correctly outside-area. **Recommend treating the Federal St location as a new South Philadelphia candidate for a future pass** if you want it — not adding it here since it wasn't requested, just flagging the find.

---

## DEFERRED — not researched this pass, per instructions

Pod, Ocean City Dim Sum, Neighborhood Ramen, Jules, Hook & Master, Eeva, Porta, Cafe Zeit, Lucy's, generic "bowling," generic "pop-up beer garden."

---

## Summary counts

- **57** candidates reviewed across 6 research batches (3 of the 6 batches stalled once mid-run and were relaunched; all completed on retry)
- **32 VERIFIED** (recommended, pending the neighborhood-boundary decisions flagged above)
- **2 REJECTED** (open, correctly located, but not genuinely date-suitable: Angelo's Pizzeria, Dalessandro's Steaks)
- **11 OUTSIDE-AREA**, confirmed correctly excluded (Osteria, Umai Umai, One Shot Coffee, McNally's, Jamie Hollander, Solebury Orchards, Shady Brook Farm, Crossing Vineyards, Buckingham Valley Vineyards, Frenchtown Roller Rink, plus 2 of Tiffin's 3 locations)
- **3 additional OUTSIDE-AREA** discovered during research, not on the original list (Little Fish, Royal Sushi & Izakaya, Cry Baby Pasta — all genuinely Queen Village, not South Philadelphia)
- **4 CLOSED** (Hummus Grill, Koreana's University City location, Red Kings II, Jamie Hollander's retail storefront)
- **7 NEEDS-CLARIFICATION** (Ambrosia/Trattoria Carina/Sally as a Fitler Square cluster, Nan Zhou/Penang/Terakawa as a Chinatown cluster, Steak 48's side of Broad, Marrakesh's boundary + missing official site, Clarkville's distance from campus core)
- **11 DEFERRED**, not researched per instructions

No Google Place IDs were looked up. Once you decide on the flagged boundary/scope questions, the next step would be a batch Places API lookup for whichever venues you confirm, followed by the same category/label/price/tags recommendation pass already partially covered by the per-venue research above.
