"use client";

import { useSyncExternalStore } from "react";
import {
  dismissToast,
  getServerToastSnapshot,
  getToastSnapshot,
  subscribeToToast,
} from "@/lib/toast";

/** Shows the current toast (see lib/toast.ts) above the tab bar on phones. */
export function ToastHost() {
  const toast = useSyncExternalStore(subscribeToToast, getToastSnapshot, getServerToastSnapshot);
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom)+0.75rem)] z-[60] flex justify-center px-4 md:bottom-6">
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-sm text-white shadow-lg shadow-ink/25"
      >
        <span>{toast.message}</span>
        {toast.onAction && (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              dismissToast();
            }}
            className="min-h-9 rounded-full bg-white/15 px-4 font-semibold text-white hover:bg-white/25"
          >
            {toast.actionLabel ?? "Undo"}
          </button>
        )}
      </div>
    </div>
  );
}
