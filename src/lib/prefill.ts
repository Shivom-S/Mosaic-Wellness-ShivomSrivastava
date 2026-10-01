import { WORRIES, WORRY, type Answers, type WorryId } from "@/content";

// Answers the AI intake was sure about, handed to the Check screen for one visit.
// sessionStorage, so it dies with the tab. Read once, then removed.

const key = (id: WorryId) => `1am:prefill:${id}`;
const IDS: WorryId[] = WORRIES.map((w) => w.id);

/** Keeps only answers that match a real question and option, in the shape the flow expects. */
export function sanitizeAnswers(id: WorryId, raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== "object") return out;
  for (const q of WORRY[id].questions) {
    const given = (raw as Record<string, unknown>)[q.id];
    if (!Array.isArray(given)) continue;
    let opts = q.options.filter((o) => given.includes(o.id));
    if (opts.length === 0) continue;
    if (!q.multi) opts = opts.slice(0, 1);
    else if (opts.some((o) => o.exclusive)) opts = opts.filter((o) => o.exclusive).slice(0, 1);
    out[q.id] = opts.map((o) => o.id);
  }
  return out;
}

export function savePrefill(id: WorryId, answers: Answers) {
  try {
    if (Object.keys(answers).length) window.sessionStorage.setItem(key(id), JSON.stringify(answers));
  } catch {
    /* private mode: the check just starts empty */
  }
}

/** Peek without removing; call `removePrefill` once it has been taken. */
export function readPrefill(id: WorryId): Answers {
  try {
    const raw = window.sessionStorage.getItem(key(id));
    return raw ? sanitizeAnswers(id, JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function removePrefill(id: WorryId) {
  try {
    window.sessionStorage.removeItem(key(id));
  } catch {
    /* nothing to remove */
  }
}

export const clearAllPrefill = () => IDS.forEach(removePrefill);
