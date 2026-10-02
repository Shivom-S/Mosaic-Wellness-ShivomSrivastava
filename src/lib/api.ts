// Optional backend (Replit). If VITE_API_URL isn't set, every call is a quiet no-op
// and the app works exactly as before.
import { WORRIES, type Answers, type Option, type Question, type Result, type Verdict, type WorryId } from "@/content";

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
export const apiEnabled = Boolean(BASE);

export interface Pulse {
  windowDays: number;
  total: number;
  helpedPct: number | null;
  byWorry: Record<WorryId, number>;
  byVerdict: Record<Verdict, number>;
}

export function sendRating(r: { worry: WorryId | "ai"; verdict: Verdict; answer: string; tone?: string }) {
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
interface Health {
  ai: AiName | null;
  checks: AiName | null;
}
let healthCache: Health | undefined;
let healthInflight: Promise<Health | null> | null = null;

const asName = (v: unknown): AiName | null => (v === "claude" || v === "gemini" ? v : null);

/** One /api/health call feeds both flags. A good reply is cached; a failed one is retried next time. */
function loadHealth(): Promise<Health | null> {
  if (!BASE) return Promise.resolve(null);
  if (healthCache) return Promise.resolve(healthCache);
  healthInflight ??= (async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(`${BASE}/api/health`, { signal: ctrl.signal });
      // 503 still carries the ai fields (DB may be down while AI works)
      const j = (await res.json()) as { ai?: unknown; checks?: unknown } | null;
      healthCache = { ai: asName(j?.ai), checks: asName(j?.checks) };
      return healthCache;
    } catch {
      return null;
    } finally {
      clearTimeout(t);
      healthInflight = null;
    }
  })();
  return healthInflight;
}

/** Which AI the backend has connected for routing, or null. */
export const aiStatus = async (): Promise<AiName | null> => (await loadHealth())?.ai ?? null;

/** Which AI the backend has connected for building checks, or null. */
export const checksStatus = async (): Promise<AiName | null> => (await loadHealth())?.checks ?? null;

// ---------- AI-built checks (for anything the seven reviewed checks don't cover) ----------

export interface AiCheck {
  topic: string;
  title: string;
  whisper: string;
  blurb: string;
  questions: Question[];
}

export type AiResult = Omit<Result, "sources"> & { dont: string[] };

export type AiQuestionsReply = { health: false } | { health: true; urgent: boolean; check: AiCheck | null };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : []);

function toQuestions(v: unknown): Question[] {
  if (!Array.isArray(v)) return [];
  const out: Question[] = [];
  for (const q of v) {
    if (!q || typeof q !== "object") continue;
    const raw = q as Record<string, unknown>;
    const options: Option[] = Array.isArray(raw.options)
      ? raw.options.flatMap((o) => {
          if (!o || typeof o !== "object") return [];
          const r = o as Record<string, unknown>;
          if (!str(r.id) || !str(r.label)) return [];
          const opt: Option = { id: str(r.id), label: str(r.label) };
          if (str(r.hint)) opt.hint = str(r.hint);
          if (r.exclusive === true) opt.exclusive = true;
          return [opt];
        })
      : [];
    if (!str(raw.id) || !str(raw.prompt) || options.length < 2) continue;
    out.push({ id: str(raw.id), prompt: str(raw.prompt), help: str(raw.help) || undefined, multi: raw.multi === true, options });
  }
  return out;
}

/** POST with the 25s AI timeout. Null on any failure (429, 502, 503, slow, offline). */
async function postAi(path: string, body: unknown): Promise<unknown> {
  if (!BASE) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Asks the backend for a short check about whatever was typed. Null on any failure or odd reply. */
export async function aiQuestions(text: string): Promise<AiQuestionsReply | null> {
  const j = (await postAi("/api/ai/questions", { text: text.trim().slice(0, 500) })) as Record<string, unknown> | null;
  if (!j || typeof j !== "object" || typeof j.health !== "boolean") return null;
  if (!j.health) return { health: false };
  const urgent = j.urgent === true;
  const questions = toQuestions(j.questions);
  const title = str(j.title);
  if (questions.length === 0 || !title) return urgent ? { health: true, urgent, check: null } : null;
  return {
    health: true,
    urgent,
    check: { topic: str(j.topic), title, whisper: str(j.whisper), blurb: str(j.blurb), questions },
  };
}

/** Sends the answers back for a written result. Null on any failure or odd reply. */
export async function aiAnswer(
  text: string,
  check: AiCheck,
  answers: Answers,
): Promise<{ result: AiResult; urgent: boolean } | null> {
  const j = (await postAi("/api/ai/answer", {
    text: text.trim().slice(0, 500),
    check: { topic: check.topic, title: check.title, questions: check.questions },
    answers,
  })) as { result?: Record<string, unknown>; urgent?: unknown } | null;
  const r = j?.result;
  if (!r || typeof r !== "object") return null;
  const verdict = r.verdict;
  if (verdict !== "normal" && verdict !== "watch" && verdict !== "doctor") return null;
  const explainer = strs(r.explainer);
  if (!str(r.headline) || !str(r.tryTonight) || explainer.length === 0) return null;
  const redFlags = Array.isArray(r.redFlags)
    ? r.redFlags.flatMap((f) => {
        const x = f as { text?: unknown; hit?: unknown } | null;
        return x && str(x.text) ? [{ text: str(x.text), hit: x.hit === true }] : [];
      })
    : [];
  const result: AiResult = {
    verdict,
    headline: str(r.headline),
    explainer,
    redFlags,
    tryTonight: str(r.tryTonight),
    whoToSee: str(r.whoToSee) || undefined,
    urgency: str(r.urgency) || undefined,
    doctorNote: strs(r.doctorNote),
    suggestTracking: false,
    dont: strs(r.dont),
  };
  return { result, urgent: j?.urgent === true };
}
