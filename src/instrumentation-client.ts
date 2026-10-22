// Runs in the browser before the app becomes interactive. Starts PostHog for
// the KnowaPlace events (a no-op without NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN).
import { initAnalytics, listenForTrackedLinks } from "@/lib/analytics";

try {
  initAnalytics();
  listenForTrackedLinks();
} catch {
  // Analytics must never stop the app from starting.
}
