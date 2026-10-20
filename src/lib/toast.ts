// One small message at a time, shown at the bottom of the screen for a few
// seconds, with an optional action (used for "Undo"). Lives outside React so
// any component can raise it; <ToastHost /> in the root layout shows it.

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

let current: Toast | null = null;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function showToast(
  message: string,
  action?: { label: string; run: () => void },
  durationMs = 6000
): void {
  if (timer) clearTimeout(timer);
  current = { id: nextId++, message, actionLabel: action?.label, onAction: action?.run };
  emit();
  timer = setTimeout(dismissToast, durationMs);
}

export function dismissToast(): void {
  if (timer) clearTimeout(timer);
  timer = undefined;
  current = null;
  emit();
}

export function subscribeToToast(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastSnapshot(): Toast | null {
  return current;
}

export function getServerToastSnapshot(): Toast | null {
  return null;
}
