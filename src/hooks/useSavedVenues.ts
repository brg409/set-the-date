"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getSavedVenueIdsSnapshot,
  getServerSavedVenueIdsSnapshot,
  subscribeToSavedVenues,
  toggleSavedVenue,
} from "@/lib/savedVenues";

export function useSavedVenues() {
  const savedIds = useSyncExternalStore(
    subscribeToSavedVenues,
    getSavedVenueIdsSnapshot,
    getServerSavedVenueIdsSnapshot
  );

  const toggle = useCallback((id: string) => {
    toggleSavedVenue(id);
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, isSaved, toggle };
}
