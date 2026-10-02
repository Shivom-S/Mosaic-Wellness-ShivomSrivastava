// AI intake: turns free text ("baal bahut gir rahe hain since dengue") into
// { worry, urgent, answers } using ONLY ids from worries.json. The AI never writes
// medical advice; the deterministic engine in the app still decides every verdict.
// Supports ANTHROPIC_API_KEY (Claude) or GEMINI_API_KEY (Google AI Studio).
import { readFileSync } from "node:fs";
import { geminiJSON } from "./gemini.js";

const SCHEMA = JSON.parse(readFileSync(new URL("./worries.json", import.meta.url), "utf8"));
const IDS = new Set(SCHEMA.map((w) => w.id));
export const SPECIALISTS = [
  "a general physician", "a dermatologist", "a gynaecologist", "a paediatrician", "a gastroenterologist",
  "a psychiatrist or psychologist", "a dentist", "an eye doctor", "an ENT doctor", "an orthopaedic doctor",
  "a urologist", "emergency care",
];

export const aiProvider = process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "claude" : null;

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

// Gemini first (with its own model-to-model fallback), then Claude if a key exists.
export async function understand(text) {
  if (!aiProvider) return null;
  if (process.env.GEMINI_API_KEY) {
    try {
      const { data } = await geminiJSON({ system: SYSTEM, user: text, temperature: 0, maxOutputTokens: 400, timeoutMs: 4000, budgetMs: 5500 });
      return clean(JSON.stringify(data));
    } catch (e) {
      if (!process.env.ANTHROPIC_API_KEY) throw e;
      console.warn("understand: gemini failed, trying claude:", String(e).slice(0, 160));
    }
  }
  return clean(await callClaude(text));
}
