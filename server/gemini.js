// One Gemini caller for the whole server.
// Google retires model names for new keys (e.g. "gemini-2.5-flash is no longer available to
// new users"), so we don't trust a hardcoded name: if a model 404s, we ask the API which
// models this key can use and pick the newest general "flash" model.
const BASE = "https://generativelanguage.googleapis.com/v1beta";
let chosen = process.env.GEMINI_MODEL || null;
let discovering = null;

async function discover() {
  const res = await fetch(`${BASE}/models?pageSize=200`, {
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`gemini models ${res.status} ${(await res.text()).slice(0, 160)}`);
  const { models = [] } = await res.json();
  const usable = models
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .filter((n) => /gemini/.test(n) && /flash/.test(n) && !/(lite|image|tts|live|audio|thinking|exp|preview|embedding)/.test(n));
  const ver = (n) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || "0");
  usable.sort((a, b) => ver(b) - ver(a) || a.length - b.length);
  const pick = usable[0] || models.map((m) => m.name.replace(/^models\//, "")).find((n) => /gemini.*flash/.test(n));
  if (!pick) throw new Error("gemini: no flash model available for this key");
  console.log("gemini model:", pick);
  return pick;
}

async function model() {
  if (chosen) return chosen;
  discovering ??= discover().finally(() => (discovering = null));
  chosen = await discovering;
  return chosen;
}

async function post(name, body, timeoutMs) {
  return fetch(`${BASE}/models/${name}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/** Calls Gemini and returns the text of the first candidate. */
export async function gemini({ system, user, schema, temperature = 0.3, maxOutputTokens = 2048, timeoutMs = 20000 }) {
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
  let name = await model();
  let res = await post(name, body, timeoutMs);
  if (res.status === 404) {
    // Retired or unknown model: rediscover once and retry.
    chosen = null;
    if (process.env.GEMINI_MODEL) console.warn(`GEMINI_MODEL=${process.env.GEMINI_MODEL} isn't available; discovering one`);
    name = await discover();
    chosen = name;
    res = await post(name, body, timeoutMs);
  }
  if (res.status === 400 && schema) {
    // Some models reject parts of a response schema; JSON mode without it still works.
    const text = await res.text();
    if (/schema|responseSchema|Invalid JSON payload/i.test(text)) {
      delete body.generationConfig.responseSchema;
      res = await post(name, body, timeoutMs);
    } else {
      throw new Error(`gemini 400 ${text.slice(0, 200)}`);
    }
  }
  if (!res.ok) throw new Error(`gemini ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
}

export const geminiModel = () => chosen;
