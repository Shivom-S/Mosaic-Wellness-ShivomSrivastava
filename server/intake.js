// AI intake: turns free text ("baal bahut gir rahe hain since dengue") into
// { worry, urgent, answers } using ONLY ids from worries.json. The AI never writes
// medical advice; the deterministic engine in the app still decides every verdict.
// Supports ANTHROPIC_API_KEY (Claude) or GEMINI_API_KEY (Google AI Studio).
import { readFileSync } from "node:fs";

const SCHEMA = JSON.parse(readFileSync(new URL("./worries.json", import.meta.url), "utf8"));
const IDS = new Set(SCHEMA.map((w) => w.id));
export const SPECIALISTS = [
  "a general physician", "a dermatologist", "a gynaecologist", "a paediatrician", "a gastroenterologist",
  "a psychiatrist or psychologist", "a dentist", "an eye doctor", "an ENT doctor", "an orthopaedic doctor",
  "a urologist", "emergency care",
];

export const aiProvider = process.env.ANTHROPIC_API_KEY ? "claude" : process.env.GEMINI_API_KEY ? "gemini" : null;

const SYSTEM = `You are the intake step of 1AM, a health-worry app. Classify the user's message. Output ONLY a JSON object, no prose.
Schema: {"worry": one of ${JSON.stringify([...IDS])} or null, "urgent": boolean, "answers": {questionId: [optionId,...]}, "echo": string, "triage": null or {"topic": string, "specialist": one of ${JSON.stringify(SPECIALISTS)}}}
Rules:
- "worry": the single best match from the catalogue below, or null if none fits.
- "urgent": true ONLY if the message describes a possible emergency right now (chest pain, trouble breathing, fainting, stroke signs, heavy uncontrolled bleeding, a very drowsy/floppy child, thoughts of self-harm).
- "answers": pre-fill ONLY questions the message clearly answers, using exact ids from the catalogue. For single-choice questions give exactly one id. Never guess. Omit unclear questions.
- "echo": a calm, neutral restatement of what they said, max 14 words, in English, no advice, no diagnosis.
- "triage": ONLY when "worry" is null and the message is a health concern: "topic" = 1–4 neutral words naming the concern (e.g. "knee pain"), "specialist" = the kind of clinician who usually handles it, from the list. If "urgent" is true use "emergency care". Otherwise null. Never add advice.
- Messages may be in English, Hindi or Hinglish.
Catalogue: ${JSON.stringify(SCHEMA)}`;

function clean(raw) {
  let obj;
  try {
    const m = String(raw).match(/\{[\s\S]*\}/);
    obj = JSON.parse(m ? m[0] : raw);
  } catch {
    return null;
  }
  const worry = IDS.has(obj.worry) ? obj.worry : null;
  const answers = {};
  if (worry && obj.answers && typeof obj.answers === "object") {
    const w = SCHEMA.find((x) => x.id === worry);
    for (const q of w.questions) {
      const picked = Array.isArray(obj.answers[q.id]) ? obj.answers[q.id] : [];
      const valid = picked.filter((id) => q.options.some((o) => o.id === id));
      if (valid.length && (q.multi || valid.length === 1)) answers[q.id] = q.multi ? valid : [valid[0]];
    }
  }
  const echo = typeof obj.echo === "string" ? obj.echo.slice(0, 120) : "";
  let triage = null;
  if (!worry && obj.triage && typeof obj.triage === "object" && SPECIALISTS.includes(obj.triage.specialist)) {
    const topic = typeof obj.triage.topic === "string" ? obj.triage.topic.replace(/[^\p{L}\p{N} '-]/gu, "").slice(0, 40).trim() : "";
    triage = { topic, specialist: obj.urgent === true ? "emergency care" : obj.triage.specialist };
  }
  return { worry, urgent: obj.urgent === true, answers, echo, triage };
}

async function callClaude(text) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`claude ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content?.map((c) => c.text || "").join("") ?? "";
}

async function callGemini(text) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0, maxOutputTokens: 400 },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`gemini ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
}

export async function understand(text) {
  if (!aiProvider) return null;
  const raw = aiProvider === "claude" ? await callClaude(text) : await callGemini(text);
  return clean(raw);
}
