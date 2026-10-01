// Optional backend (Replit). If VITE_API_URL isn't set, every call is a quiet no-op
// and the app works exactly as before.
import { WORRIES, type Verdict, type WorryId } from "@/content";

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
export const apiEnabled = Boolean(BASE);

export interface Pulse {
  windowDays: number;
  total: number;
  helpedPct: number | null;
  byWorry: Record<WorryId, number>;
  byVerdict: Record<Verdict, number>;
}

export function sendRating(r: { worry: WorryId; verdict: Verdict; answer: string; tone?: string }) {
  if (!BASE) return;
  try {
    void fetch(`${BASE}/api/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* offline or blocked: fine */
  }
}

export async function getPulse(): Promise<Pulse | null> {
  if (!BASE) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${BASE}/api/pulse`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok ? ((await res.json()) as Pulse) : null;
  } catch {
    return null;
  }
}

// ---------- Optional AI intake ----------
// The model only routes words to a worry and pre-fills answers. Verdicts stay local and rule-based.

export interface Understood {
  worry: WorryId | null;
  urgent: boolean;
  answers: Record<string, string[]>;
  echo: string;
  /** Only when `worry` is null: who to ask about a concern we don't cover. */
  triage: { topic: string; specialist: string } | null;
}

const WORRY_IDS: readonly string[] = WORRIES.map((w) => w.id);

/** Sends the text to the backend for routing. Null on any failure (AI off, slow, offline, odd reply). */
export async function understand(text: string): Promise<Understood | null> {
  if (!BASE) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${BASE}/api/understand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim().slice(0, 500) }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const j = (await res.json()) as Partial<Understood> | null;
    if (!j || typeof j !== "object") return null;
    const worry = typeof j.worry === "string" && WORRY_IDS.includes(j.worry) ? (j.worry as WorryId) : null;
    const answers: Record<string, string[]> = {};
    if (j.answers && typeof j.answers === "object") {
      for (const [q, v] of Object.entries(j.answers)) {
        if (Array.isArray(v)) answers[q] = v.filter((x): x is string => typeof x === "string");
      }
    }
    let triage: Understood["triage"] = null;
    const tr = j.triage;
    if (!worry && tr && typeof tr === "object" && typeof tr.specialist === "string" && tr.specialist.trim()) {
      triage = { topic: typeof tr.topic === "string" ? tr.topic.trim() : "", specialist: tr.specialist.trim() };
    }
    return { worry, urgent: j.urgent === true, answers, echo: typeof j.echo === "string" ? j.echo.trim() : "", triage };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

type AiName = "claude" | "gemini";
let aiCache: AiName | null | undefined;
let aiInflight: Promise<AiName | null> | null = null;

/** Which AI the backend has connected, or null. A good reply is cached; a failed one is retried next time. */
export function aiStatus(): Promise<AiName | null> {
  if (!BASE) return Promise.resolve(null);
  if (aiCache !== undefined) return Promise.resolve(aiCache);
  aiInflight ??= (async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(`${BASE}/api/health`, { signal: ctrl.signal });
      // 503 still carries the ai field (DB may be down while AI works)
      const j = (await res.json()) as { ai?: unknown } | null;
      aiCache = j?.ai === "claude" || j?.ai === "gemini" ? j.ai : null;
      return aiCache;
    } catch {
      return null;
    } finally {
      clearTimeout(t);
      aiInflight = null;
    }
  })();
  return aiInflight;
}
