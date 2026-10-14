"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getMyPlacesSnapshot,
  getServerMyPlacesSnapshot,
  subscribeToMyPlaces,
  toggleFavorite,
  toggleVisited,
  toggleWantToGo,
  type PlaceEntry,
} from "@/lib/myPlaces";

export function useMyPlaces() {
  const state = useSyncExternalStore(
    subscribeToMyPlaces,
    getMyPlacesSnapshot,
    getServerMyPlacesSnapshot
  );

  const getEntry = useCallback(
    (venueId: string): PlaceEntry | undefined => state.entries[venueId],
    [state]
  );

  return {
    entries: state.entries,
    getEntry,
    isSaved: (venueId: string) => Boolean(state.entries[venueId]?.wantToGo),
    isVisited: (venueId: string) => Boolean(state.entries[venueId]?.visited),
    isFavorite: (venueId: string) => Boolean(state.entries[venueId]?.favorite),
    toggleSaved: toggleWantToGo,
    toggleVisited,
    toggleFavorite,
  };
}
