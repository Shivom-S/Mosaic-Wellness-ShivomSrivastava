import { useSyncExternalStore } from "react";

// One tiny shared flag for the urgent-help sheet, so the header, the "say it" box and the
// result page can all open the same one.
let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const setUrgentOpen = (next: boolean) => {
  open = next;
  emit();
};
export const openUrgent = () => setUrgentOpen(true);

export function useUrgentOpen() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => open,
    () => false,
  );
}
