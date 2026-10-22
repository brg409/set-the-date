# KnowaPlace analytics

Two tools, both free at KnowaPlace's size:

| What | Where to look | Tool |
|---|---|---|
| Visitors, page views, top pages, referrers, countries, mobile vs desktop | [Vercel → set-the-date → Analytics](https://vercel.com/brg409/set-the-date/analytics) | Vercel Web Analytics (Hobby: 50,000 events/month, 1 month of history) |
| Searches, filters, recommendations, place views, saves, Been There, Reserve/Website clicks | [PostHog (US)](https://us.posthog.com) | PostHog product analytics (free: 1M events/month, 1 year of history) |

Code: `src/lib/analytics.ts` (PostHog setup and every event), `src/lib/trackLink.ts`
(Reserve/Website link attributes), `src/instrumentation-client.ts` (starts PostHog),
`<Analytics />` in `src/app/layout.tsx` (Vercel). Tests: `npm run test:analytics`.

## Privacy

- No cookies, localStorage or sessionStorage from either tool. PostHog runs in
  cookieless mode with in-memory state only, and never creates person profiles.
- No session recording, autocapture, heatmaps, surveys, page-leave, scroll,
  performance or error capture; nothing is loaded from PostHog beyond the event endpoint.
- Event properties are only fixed filter values, our own venue ids, counts and
  positions. **Never sent:** ratings, notes, form contents, email addresses,
  anything typed, or anything identifying a person.
- PostHog still records standard browser context with each event (page URL,
  browser, OS, device type, screen size). The page URL contains the search
  filters, which are not personal. Client IP addresses are discarded by the
  PostHog project setting below.
- Events go through this site's `/ingest` path (a rewrite in `next.config.ts`),
  so blockers that block posthog.com don't drop them.

## Events

| Event | When | Properties |
|---|---|---|
| `search` | A new search reaches the results page (not when returning to it) | `occasion`, `vibe`, `neighborhood`, `budget` (`$`–`$$$$`), `outing` (`anything` if unset), `indoor_outdoor` (`any`), `food` (`any`), `combination` (all seven, joined with ` \| `), `exact_matches`, `few_matches` (fewer than 3) |
| `search_widened` | The visitor taps a widening button | the search properties, `widened` (`neighborhood`, `budget`, `indoorOutdoor`, `food`, `outing`), `exact_matches` |
| `recommendation_shown` | A venue first appears in a search's results (once per venue per search) | `venue_id`, `position` (1–3), `set` (1 = first three), `widened` |
| `place_viewed` | A place page opens | `venue_id`, `source` (`search`, `my-places`, `home`, `direct`) |
| `place_saved` | Saved to Want to Go (removals aren't tracked) | `venue_id` |
| `been_there` | Marked Been There (unmarking isn't tracked) | `venue_id` |
| `reserve_click` | Reserve a Table tapped | `venue_id`, `from` (`results`, `place`, `my-places`) |
| `website_click` | Visit Website tapped | `venue_id`, `from` |

Venue ids are the readable slugs used in place URLs, e.g. `parc` for
`/place/parc`.

## Setup

### PostHog project settings (one time)

In [PostHog → Settings → Project](https://us.posthog.com/settings/project):

1. **Web analytics → Cookieless server hash mode: on.** Required: without it
   PostHog ignores every KnowaPlace event.
2. **IP data capture → Discard client IP data: on.**
3. Session replay, heatmaps, surveys, autocapture, web vitals and exception
   autocapture: off. The code turns these off too; this keeps them off if the
   code ever changes.
4. Organization → Billing: set a billing limit so usage can never be charged.

### Environment variables in Vercel

1. Open [Vercel → set-the-date → Settings → Environment Variables](https://vercel.com/brg409/set-the-date/settings/environment-variables).
2. Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` = your `phc_…` project token
   (PostHog → Settings → Project → Project token). Tick **Production** and
   **Preview**. Don't mark it Sensitive: it's public by design and is built
   into the site's JavaScript.
3. Add `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com`, same environments.
4. Redeploy: Deployments → the latest `knowaplace-v2` deployment → ⋯ →
   **Redeploy**. `NEXT_PUBLIC_` values are baked in at build time, so an
   existing deployment won't pick them up.

Without the token the site works exactly the same and sends no PostHog events.
For local development the same two lines go in `.env.local` (git-ignored).

## Checking that events arrive

1. Open the preview deployment (or production after launch) in a normal browser
   window. Content blockers usually let `/ingest` through, but turn them off
   if nothing shows up.
2. Run a search, open a place, tap Save and Been Here, and tap Visit Website or
   Reserve a Table.
3. In PostHog, open **Activity** (left sidebar). Within a minute you should see
   `search`, `recommendation_shown`, `place_viewed`, `place_saved`,
   `been_there` and `website_click` / `reserve_click`. Click one to see its
   properties; they should match the table above and nothing else of yours.
4. In the browser's dev tools (Application tab), cookies, localStorage and
   sessionStorage should hold nothing from PostHog. KnowaPlace's own
   `knowaplace:` keys are expected.

Preview and local test traffic lands in the same PostHog project. To leave it
out of charts, add a filter `Current URL` *does not contain* `vercel.app`
(once on a custom domain) or `localhost`; or delete the test events from the
first day.

## Dashboard

In PostHog: **Dashboards → New dashboard → Blank**, name it *KnowaPlace*, then
add these insights (**+ Add insight → Trends** unless noted). Use "Last 30 days"
or longer.

| Insight | Event | Breakdown / setting | Display |
|---|---|---|---|
| Searches per day | `search` | none | Line |
| Top occasions | `search` | breakdown `occasion` | Bar (total value) |
| Top vibes | `search` | breakdown `vibe` | Bar (total value) |
| Top neighborhoods | `search` | breakdown `neighborhood` | Bar (total value) |
| Budgets | `search` | breakdown `budget` | Bar (total value) |
| Outing types | `search` | breakdown `outing` | Bar (total value) |
| Top filter combinations | `search` | breakdown `combination` | Table |
| Thin searches | `search` | filter `few_matches` = true, breakdown `combination` | Table |
| How people widen | `search_widened` | breakdown `widened` | Bar (total value) |
| Most recommended places | `recommendation_shown` | breakdown `venue_id` | Table |
| Most opened places | `place_viewed` | breakdown `venue_id` | Table |
| Most saved | `place_saved` | breakdown `venue_id` | Table |
| Most "Been There" | `been_there` | breakdown `venue_id` | Table |
| Reserve vs Website clicks | `reserve_click`, `website_click` | breakdown `venue_id` | Table |
| Search → place → reserve | **Funnel**: `search` → `place_viewed` → `reserve_click` | | Funnel |

With no cookies, PostHog groups a visitor's events by an anonymous hash that
resets daily, so funnels and "unique visitors" count the same device on the
same day as one person, and the same person on two days as two.

Mobile vs desktop is in Vercel Analytics (Devices panel). PostHog can split
any insight by the built-in `Device type` property too.

## Turning it off

- PostHog: remove `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` in Vercel and redeploy.
- Vercel: Analytics tab → Disable, or remove `<Analytics />` from `layout.tsx`.
