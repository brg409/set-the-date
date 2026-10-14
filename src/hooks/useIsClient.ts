"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during server render and the hydration pass, true afterwards.
 * Lets a component read browser-only state (sessionStorage) in a lazy
 * initializer without a hydration mismatch: render a placeholder until this
 * is true, then mount the part that reads storage.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
