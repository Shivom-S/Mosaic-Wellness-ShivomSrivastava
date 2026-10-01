import { useSyncExternalStore } from "react";
import type { Answers, DailyEntry, HairCount, Result, WorryId } from "@/content";

// Everything 1AM remembers lives in localStorage under "1am:". Every call is wrapped in
// try/catch so private mode (or a full disk) never breaks the app: if localStorage
// refuses, we quietly keep the value in memory for this session instead.

const PREFIX = "1am:";
const CHANGE = "1am:change";

const memory = new Map<string, string>();
let version = 0;

const notify = () => {
  version += 1;
  try {
    window.dispatchEvent(new Event(CHANGE));
  } catch {
    /* no window, nothing to tell */
  }
};

export interface SavedCheck {
  answers: Answers;
  count?: HairCount;
  result: Result;
  at: number;
}

export const keys = {
  theme: "theme",
  comfort: "comfort",
  voiceNote: "voice-note",
  last: (id: WorryId) => `last:${id}`,
  track: (id: WorryId) => `track:${id}`,
  feedback: (id: WorryId) => `feedback:${id}`,
};

function read(key: string): string | null {
  try {
    const v = window.localStorage.getItem(PREFIX + key);
    if (v !== null) return v;
  } catch {
    /* fall through to memory */
  }
  return memory.get(key) ?? null;
}

export const store = {
  get<T>(key: string): T | null {
    const raw = read(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown) {
    const raw = JSON.stringify(value);
    try {
      window.localStorage.setItem(PREFIX + key, raw);
      memory.delete(key);
    } catch {
      memory.set(key, raw);
    }
    notify();
  },

  remove(key: string) {
    memory.delete(key);
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* nothing to remove */
    }
    notify();
  },

  /** Remove every key that starts with "1am:". */
  wipeAll() {
    memory.clear();
    try {
      const doomed: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(PREFIX)) doomed.push(k);
      }
      doomed.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* private mode: nothing was stored anyway */
    }
    notify();
  },
};

/** Re-render when anything under "1am:" changes. */
export function useStoreVersion() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(CHANGE, cb);
      return () => window.removeEventListener(CHANGE, cb);
    },
    () => version,
    () => 0,
  );
}

// ---------- typed readers (with just enough validation to survive hand-edited storage) ----------

export function loadLast(id: WorryId): SavedCheck | null {
  const v = store.get<SavedCheck>(keys.last(id));
  if (!v || !v.result || !Array.isArray(v.result.explainer) || !Array.isArray(v.result.redFlags)) return null;
  if (!["normal", "watch", "doctor"].includes(v.result.verdict)) return null;
  return v;
}

export function loadEntries(id: WorryId): DailyEntry[] {
  const v = store.get<DailyEntry[]>(keys.track(id));
  if (!Array.isArray(v)) return [];
  return v
    .filter((e) => e && typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date))
    .map((e) => ({ date: e.date, values: e.values && typeof e.values === "object" ? e.values : {} }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function saveEntries(id: WorryId, entries: DailyEntry[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  store.set(keys.track(id), sorted);
  return sorted;
}
