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

// Same emergency patterns the server uses, so urgent help opens even offline or if the AI fails.
const EMERGENCY = /(chest[^.]{0,20}(pain|pressure|tight|hurt|heavy|crush|squeez)|(pain|pressure|tight|hurt)[^.]{0,20}chest|heart attack|seene? (mein|me) dard|can'?t breathe|trouble breathing|breathless|faint|passed out|unconscious|seizure|stroke|face droop|slurred|severe bleeding|won'?t stop bleeding|suicid|kill myself|self[- ]harm|end my life|overdose|anaphyla|throat (closing|swelling)|saans nahi)/i;
export const looksUrgent = (text: string) => EMERGENCY.test(text);
