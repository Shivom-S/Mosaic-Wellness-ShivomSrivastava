import { useSyncExternalStore } from "react";
import type { Answers, DailyEntry, HairCount, Result, WorryId } from "@/content";
import type { AiCheck, AiResult } from "@/lib/api";

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
  textsize: "textsize",
  voiceNote: "voice-note",
  last: (id: WorryId) => `last:${id}`,
  track: (id: WorryId) => `track:${id}`,
  feedback: (id: WorryId | "ai") => `feedback:${id}`,
  aiLast: "ai:last",
  aiHistory: "ai:history",
  aiCheck: "ai:check", // sessionStorage only
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
    session.wipeAi();
    notify();
  },
};

// The AI check being built lives in sessionStorage ("1am:ai:check"), so it dies with the tab.
// Same rule as above: if the browser refuses, keep it in memory for this visit.
const SESSION_AI_PREFIX = "1am:ai:";
const sessionMemory = new Map<string, string>();

export const session = {
  get<T>(key: string): T | null {
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(PREFIX + key);
    } catch {
      /* fall through to memory */
    }
    raw ??= sessionMemory.get(key) ?? null;
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
      window.sessionStorage.setItem(PREFIX + key, raw);
      sessionMemory.delete(key);
    } catch {
      sessionMemory.set(key, raw);
    }
  },

  remove(key: string) {
    sessionMemory.delete(key);
    try {
      window.sessionStorage.removeItem(PREFIX + key);
    } catch {
      /* nothing to remove */
    }
  },

  /** Clear every "1am:ai:" key in sessionStorage. */
  wipeAi() {
    sessionMemory.clear();
    try {
      const doomed: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(SESSION_AI_PREFIX)) doomed.push(k);
      }
      doomed.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {
      /* nothing was stored */
    }
  },
};

// ---------- AI-built checks ----------

export interface AiPending {
  text: string;
  check: AiCheck;
  createdAt: number;
}

export interface AiSaved {
  text: string;
  check: AiCheck;
  answers: Answers;
  result: AiResult;
  urgent?: boolean;
  at: number;
}

const VERDICTS = ["normal", "watch", "doctor"];

export function loadAiPending(): AiPending | null {
  const v = session.get<AiPending>(keys.aiCheck);
  return v && v.check && Array.isArray(v.check.questions) && v.check.questions.length > 0 ? v : null;
}

export function loadAiLast(): AiSaved | null {
  const v = store.get<AiSaved>(keys.aiLast);
  if (!v || !v.check || !v.result || !Array.isArray(v.result.explainer) || !Array.isArray(v.result.redFlags)) return null;
  if (!Array.isArray(v.result.dont) || !Array.isArray(v.result.doctorNote) || !VERDICTS.includes(v.result.verdict)) return null;
  return v;
}

export function loadAiHistory(): AiSaved[] {
  const v = store.get<AiSaved[]>(keys.aiHistory);
  if (!Array.isArray(v)) return [];
  return v.filter((e) => e && typeof e.at === "number" && e.check && e.result && VERDICTS.includes(e.result.verdict));
}

/** Make this the AI result on screen. A new entry starts without the old entry's feedback. */
export function setAiLast(entry: AiSaved) {
  store.remove(keys.feedback("ai"));
  store.set(keys.aiLast, entry);
}

/** Save a finished AI check: it becomes "last", and goes on the front of the history (max 5). */
export function saveAiResult(entry: AiSaved) {
  setAiLast(entry);
  const rest = loadAiHistory().filter((e) => e.at !== entry.at);
  store.set(keys.aiHistory, [entry, ...rest].slice(0, 5));
}

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
