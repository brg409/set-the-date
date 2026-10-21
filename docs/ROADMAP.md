# KnowaPlace roadmap: not built yet

These are deliberately **not** in the app. Each needs data the venue database
doesn't have yet, and recommendations for them would be guesses until it does.

## Lunch and Brunch
- **Needs:** a verified field per venue for which meals it serves (breakfast,
  brunch, lunch, dinner) and on which days, with the date it was checked.
- **Sources:** the venue's own website or a phone call. We don't copy Google's
  opening-hours data into our database (its terms limit storing it).
- **Scope:** about 100 venues to start (the roughly 36 whose records hint at
  daytime service, plus casual restaurants). Dizengoff, K'Far and Sabrina's
  Cafe are the first beneficiaries; today they are found through Anything only.

## New occasions
- **Birthday:** needs celebration suitability per venue (group seating, private
  or semi-private space, dessert/celebration offerings). Special occasion covers
  the dressier cases today.
- **Family Dinner:** needs family facts per venue (kids' menu, early service,
  noise tolerance, seating for larger parties, stroller/accessibility notes).
- **Friends Night Out:** needs group-friendliness per venue (seating for
  groups, group reservations, shareable plates, energy) and new scoring cases in
  the engine for the new occasion. Only after the data exists.

## How to add one safely
1. Add the data field and verify it venue by venue (never infer it from a label).
2. Add the option and its scoring, then regression tests that compare
   searches before and after.
3. Keep Anything unchanged and every venue reachable.
