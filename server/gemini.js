// One Gemini caller for the whole server, with model fallback.
//
// Why: Google retires model names for new keys ("gemini-2.5-flash is no longer available to
// new users"), and individual models hit per-model quotas (429) or overload (503). So instead of
// one hardcoded name we keep a ranked list of the models this key can actually use, and if one
// can't reply we move on to the next. Bad keys (400 key / 401 / 403) stop immediately, because
// no other model will fix those.
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_ATTEMPTS = 4; // models tried per request
const LIST_TTL = 60 * 60 * 1000; // re-list models hourly
const COOLDOWN = { 429: 60_000, 503: 20_000, 500: 20_000, 502: 20_000, 504: 20_000 };

let ranked = null; // cached model list, best first
let rankedAt = 0;
let listing = null;
let lastGood = null; // the model that last replied, tried first
const cooling = new Map(); // model -> time it can be used again

const key = () => process.env.GEMINI_API_KEY;
const ver = (n) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || "0");

async function listModels() {
  const res = await fetch(`${BASE}/models?pageSize=200`, {
    headers: { "x-goog-api-key": key() },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`gemini models ${res.status} ${(await res.text()).slice(0, 160)}`);
  const { models = [] } = await res.json();
  const names = models
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .filter((n) => /^gemini/.test(n) && !/(image|tts|live|audio|embedding|vision|aqa|learnlm)/.test(n));
  // Tiers: stable flash > flash-lite > pro > previews/experimental. Newest version first in each.
  const tier = (n) =>
    /(preview|exp|thinking)/.test(n) ? 3 : /flash-lite/.test(n) ? 1 : /flash/.test(n) ? 0 : /pro/.test(n) ? 2 : 3;
  names.sort((a, b) => tier(a) - tier(b) || ver(b) - ver(a) || a.length - b.length);
  return names;
}

async function modelList() {
  if (ranked && Date.now() - rankedAt < LIST_TTL) return ranked;
  listing ??= listModels()
    .then((names) => {
      ranked = names;
      rankedAt = Date.now();
      console.log("gemini models available:", names.slice(0, 6).join(", "));
      return names;
    })
    .finally(() => (listing = null));
  try {
    return await listing;
  } catch (e) {
    console.warn("gemini model listing failed:", String(e).slice(0, 160));
    return ranked || []; // keep going with whatever we have (plus the hints below)
  }
}

/** The order to try models in for this request. */
async function candidates() {
  const listed = await modelList();
  const hints = [process.env.GEMINI_MODEL, lastGood].filter(Boolean);
  const order = [...new Set([...hints, ...listed])];
  // Fall back to well-known aliases if listing failed entirely.
  if (!order.length) order.push("gemini-flash-latest", "gemini-flash-lite-latest", "gemini-pro-latest");
  const now = Date.now();
  const ready = order.filter((m) => !(cooling.get(m) > now));
  return (ready.length ? ready : order).slice(0, MAX_ATTEMPTS);
}

function post(name, body, timeoutMs) {
  return fetch(`${BASE}/models/${name}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

const parseJSON = (raw) => {
  const m = String(raw).match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : raw);
};

/**
 * Ask Gemini for a JSON object. Tries up to MAX_ATTEMPTS models in order; a model that
 * 404s, rate-limits, errors, times out, returns nothing, or returns unreadable JSON is skipped.
 * Resolves to { data, model }.
 */
export async function geminiJSON({ system, user, schema, temperature = 0.3, maxOutputTokens = 2048, timeoutMs = 20000, budgetMs = 23000 }) {
  // The whole request (all fallbacks) must finish inside budgetMs, or the browser gives up first.
  const deadline = Date.now() + budgetMs;
  const errors = [];
  for (const name of await candidates()) {
    const left = deadline - Date.now();
    if (left < 1500) {
      errors.push("out of time");
      break;
    }
    const tryMs = Math.min(timeoutMs, left);
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        ...(schema ? { responseSchema: schema } : {}),
        temperature,
        maxOutputTokens,
      },
    };
    try {
      let res = await post(name, body, tryMs);
      if (res.status === 400) {
        const text = await res.text();
        if (/API key|API_KEY_INVALID|PERMISSION_DENIED/i.test(text)) throw Object.assign(new Error(`gemini 400 ${text.slice(0, 200)}`), { fatal: true });
        if (schema && /schema|Invalid JSON payload|response_schema|responseSchema/i.test(text)) {
          // This model rejects part of the schema; plain JSON mode still works.
          delete body.generationConfig.responseSchema;
          res = await post(name, body, Math.max(1000, deadline - Date.now()));
        } else {
          errors.push(`${name}: 400 ${text.slice(0, 80)}`);
          continue;
        }
      }
      if (res.status === 401 || res.status === 403) {
        throw Object.assign(new Error(`gemini ${res.status} ${(await res.text()).slice(0, 200)}`), { fatal: true });
      }
      if (!res.ok) {
        const text = await res.text();
        if (COOLDOWN[res.status]) cooling.set(name, Date.now() + COOLDOWN[res.status]);
        if (res.status === 404) cooling.set(name, Date.now() + LIST_TTL); // retired for this key
        errors.push(`${name}: ${res.status} ${text.slice(0, 80)}`);
        continue;
      }
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
      if (!raw.trim()) {
        errors.push(`${name}: empty (${data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || "no text"})`);
        continue;
      }
      let parsed;
      try {
        parsed = parseJSON(raw);
      } catch {
        errors.push(`${name}: unreadable JSON`);
        continue;
      }
      if (lastGood !== name) console.log("gemini replying with:", name);
      lastGood = name;
      return { data: parsed, model: name };
    } catch (e) {
      if (e.fatal) throw e;
      errors.push(`${name}: ${e.name === "TimeoutError" ? "timeout" : String(e.message || e).slice(0, 80)}`);
    }
  }
  throw new Error(`gemini: no model could reply (${errors.join(" | ") || "no models"})`);
}

export const geminiModel = () => lastGood;
