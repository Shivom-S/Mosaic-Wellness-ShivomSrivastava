// AI-built checks for worries 1AM doesn't cover with curated rules.
// Two steps, both schema-constrained and re-validated here:
//   1. questions(text)              -> a check in the same shape as the curated ones
//   2. answer(text, check, answers) -> a result in the same shape as the curated ones
// Safety rails are enforced in code, not just in the prompt.
import { SPECIALISTS } from "./intake.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
export const checkProvider = process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "claude" : null;

const VOICE = `Voice: calm, direct, human, a little warm; never alarmist; short sentences; plain words (explain any medical term in brackets); Indian context is welcome (chai, dal, exams, monsoon). Write in English even if the user wrote Hindi/Hinglish. No em dashes, no exclamation marks, no filler words like "crucial", "essential" or "journey".`;

// ---------- Gemini structured-output schemas ----------
const S = (type, extra = {}) => ({ type, ...extra });
const STR = S("STRING");
const QUESTIONS_SCHEMA = S("OBJECT", {
  properties: {
    health: S("BOOLEAN"),
    urgent: S("BOOLEAN"),
    topic: STR,
    title: STR,
    whisper: STR,
    blurb: STR,
    questions: S("ARRAY", {
      items: S("OBJECT", {
        properties: {
          prompt: STR,
          help: STR,
          multi: S("BOOLEAN"),
          options: S("ARRAY", {
            items: S("OBJECT", { properties: { label: STR, hint: STR, exclusive: S("BOOLEAN") }, required: ["label"] }),
          }),
        },
        required: ["prompt", "multi", "options"],
      }),
    }),
  },
  required: ["health", "urgent", "topic", "title", "whisper", "questions"],
});

const ANSWER_SCHEMA = S("OBJECT", {
  properties: {
    verdict: S("STRING", { enum: ["normal", "watch", "doctor"] }),
    urgent: S("BOOLEAN"),
    headline: STR,
    explainer: S("ARRAY", { items: STR }),
    redFlags: S("ARRAY", { items: S("OBJECT", { properties: { text: STR, hit: S("BOOLEAN") }, required: ["text", "hit"] }) }),
    tryTonight: STR,
    dont: S("ARRAY", { items: STR }),
    whoToSee: S("STRING", { enum: [...SPECIALISTS, "none"] }),
    urgency: STR,
    doctorNote: S("ARRAY", { items: STR }),
    suggestTracking: S("BOOLEAN"),
  },
  required: ["verdict", "urgent", "headline", "explainer", "redFlags", "tryTonight", "dont", "whoToSee", "doctorNote"],
});

const QUESTIONS_SYSTEM = `You design a short check for 1AM, an app that gives honest, calm answers to private health worries.
Given the user's message, return JSON (schema enforced) describing a check:
- health: false if the message isn't a personal health/wellness concern (then other fields can be minimal).
- urgent: true ONLY if it describes a possible emergency right now (chest pain/pressure, trouble breathing, fainting, stroke signs, severe bleeding, a very drowsy/floppy child, thoughts of self-harm, severe allergic reaction).
- topic: 1–4 neutral words ("knee pain"). title: a warm card title, 2–5 words ("Knee that won't settle"). whisper: the 1 AM thought in first person, as a question ("Did I wreck my knee?"). blurb: one line on what the check will tell them.
- questions: 3 to 5 questions, one idea each, answerable by tapping, no typing:
  * Cover what a careful doctor would ask first: how long, how bad, what makes it better/worse, relevant context (age group, triggers) — only what changes the answer.
  * Each question has 2–6 options. Labels ≤ 60 chars, plain words; optional short "hint".
  * Use multi=true where several can be true at once; every multi question MUST end with an option {"label":"None of these","exclusive":true}.
  * The LAST question must be multi=true: "Any of these?" listing the 3–6 most important warning signs for this topic, plus "None of these" (exclusive).
  * Never ask for name, phone, exact age, location or anything identifying.
${VOICE}`;

const ANSWER_SYSTEM = `You write the answer screen for 1AM, an app that gives honest, calm answers to private health worries. You never diagnose; you explain the most likely, common explanations given what the person said, and you are explicit about uncertainty.
Return JSON (schema enforced):
- verdict: "normal" (common, fine to monitor), "watch" (keep an eye on it / track it), or "doctor" (worth a doctor visit). When unsure between two, pick the more cautious.
- urgent: true if anything they said could be an emergency; then verdict must be "doctor" and whoToSee "emergency care".
- headline: one warm, plain sentence, ≤ 90 chars (e.g. "Sounds like a strain, not a tear. Rest it and watch."). No "you have X".
- explainer: 2–3 short paragraphs (≤ 280 chars each): what's probably going on, phrased as "the most common reasons…", what would change that, and that this isn't a diagnosis.
- redFlags: 3–5 specific warning signs for this topic that mean "see a doctor"; set hit=true for each one the person reported.
- tryTonight: ONE concrete, safe thing to do tonight (≤ 240 chars). No prescription drugs, no doses, no supplements, no home remedies with real risk.
- dont: 2–3 "Tonight, don't…" items (each ≤ 140 chars), e.g. don't take medicine that wasn't prescribed for you, don't keep searching worst cases.
- whoToSee: the kind of clinician from the allowed list, or "none" for a clear "normal".
- urgency: short line like "Today, not someday." only if timing matters; else "".
- doctorNote: 3–5 factual lines restating ONLY what the person reported (for showing a doctor). No interpretation.
- suggestTracking: true if logging it for a week or two would genuinely help.
Never mention being an AI, never cite sources or URLs, never recommend products or brands.
${VOICE}`;

// ---------- model calls ----------
async function callGemini(system, user, schema) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.3, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`gemini ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
}

async function callClaude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: system + "\nRespond with a single JSON object only.",
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`claude ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.map((c) => c.text || "").join("") ?? "";
}

async function callModel(system, user, schema) {
  const raw = checkProvider === "gemini" ? await callGemini(system, user, schema) : await callClaude(system, user);
  const m = String(raw).match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : raw);
}

// ---------- validation helpers ----------
const txt = (v, max) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const arr = (v) => (Array.isArray(v) ? v : []);

const EMERGENCY = /(chest (pain|pressure|tight)|can'?t breathe|trouble breathing|breathless|faint|passed out|unconscious|seizure|stroke|face droop|slurred|severe bleeding|won'?t stop bleeding|suicid|kill myself|self[- ]harm|end my life|overdose|anaphyla|throat (closing|swelling)|seene mein dard|saans nahi)/i;

export function looksUrgent(s) {
  return EMERGENCY.test(String(s || ""));
}

function normalizeQuestions(raw) {
  const qs = arr(raw.questions).slice(0, 5).map((q, qi) => {
    const multi = q.multi === true;
    let options = arr(q.options)
      .map((o) => ({ label: txt(o.label, 80), hint: txt(o.hint, 60) || undefined, exclusive: o.exclusive === true }))
      .filter((o) => o.label)
      .slice(0, 8);
    if (multi) {
      options = options.filter((o) => !/^none( of (these|the above))?\.?$/i.test(o.label));
      options.push({ label: "None of these", exclusive: true });
    } else {
      options = options.map((o) => ({ ...o, exclusive: false }));
    }
    return {
      id: `q${qi + 1}`,
      prompt: txt(q.prompt, 120),
      help: txt(q.help, 120) || undefined,
      multi,
      options: options.map((o, oi) => ({ id: `${String.fromCharCode(97 + oi)}`, label: o.label, hint: o.hint, exclusive: o.exclusive || undefined })),
    };
  });
  return qs.filter((q) => q.prompt && q.options.length >= 2);
}

export async function aiQuestions(text) {
  const raw = await callModel(QUESTIONS_SYSTEM, `User's message: """${text}"""`, QUESTIONS_SCHEMA);
  const urgent = raw.urgent === true || looksUrgent(text);
  if (raw.health === false && !urgent) return { health: false, urgent: false };
  const questions = normalizeQuestions(raw);
  if (!urgent && questions.length < 2) throw new Error("too few questions");
  return {
    health: true,
    urgent,
    topic: txt(raw.topic, 40) || "this",
    title: txt(raw.title, 48) || txt(raw.topic, 40) || "Your worry",
    whisper: txt(raw.whisper, 90) || "Is this normal?",
    blurb: txt(raw.blurb, 120) || "A few quick taps, then an honest answer.",
    questions,
  };
}

/** Validate the check the client sends back (it round-trips through the browser). */
export function sanitizeCheck(c) {
  if (!c || typeof c !== "object") return null;
  const questions = arr(c.questions).slice(0, 5).map((q, qi) => ({
    id: `q${qi + 1}`,
    prompt: txt(q.prompt, 120),
    multi: q.multi === true,
    options: arr(q.options).slice(0, 9).map((o, oi) => ({ id: String.fromCharCode(97 + oi), label: txt(o.label, 80) })),
  }));
  if (!questions.length) return null;
  return { topic: txt(c.topic, 40), title: txt(c.title, 48), questions };
}

export async function aiAnswer(text, check, answers) {
  // Turn ids back into the labels the person actually tapped.
  const lines = check.questions.map((q) => {
    const picked = arr(answers?.[q.id]).map((id) => q.options.find((o) => o.id === id)?.label).filter(Boolean);
    return `- ${q.prompt} → ${picked.length ? picked.join("; ") : "(skipped)"}`;
  });
  const user = `Topic: ${check.topic}\nWhat they first wrote: """${text}"""\nTheir answers:\n${lines.join("\n")}`;
  const raw = await callModel(ANSWER_SYSTEM, user, ANSWER_SCHEMA);

  const urgent = raw.urgent === true || looksUrgent(text) || looksUrgent(lines.join(" "));
  let verdict = ["normal", "watch", "doctor"].includes(raw.verdict) ? raw.verdict : "watch";
  const redFlags = arr(raw.redFlags)
    .map((f) => ({ text: txt(f.text, 160), hit: f.hit === true }))
    .filter((f) => f.text)
    .slice(0, 6);
  // If they ticked any warning sign, never call it "normal".
  if (redFlags.some((f) => f.hit) && verdict === "normal") verdict = "watch";
  if (urgent) verdict = "doctor";
  let whoToSee = SPECIALISTS.includes(raw.whoToSee) ? raw.whoToSee : undefined;
  if (urgent) whoToSee = "emergency care";
  if (verdict !== "normal" && !whoToSee) whoToSee = "a general physician";

  const result = {
    verdict,
    headline: txt(raw.headline, 110) || "Here's what we can say from what you told us.",
    explainer: arr(raw.explainer).map((p) => txt(p, 320)).filter(Boolean).slice(0, 3),
    redFlags,
    tryTonight: urgent
      ? "Call 112 or get to the nearest emergency department now. Don't wait to see if it passes, and don't drive yourself."
      : txt(raw.tryTonight, 260) || "Rest, keep some water nearby, and check the warning signs below before you sleep.",
    dont: arr(raw.dont).map((d) => txt(d, 160)).filter(Boolean).slice(0, 3),
    whoToSee: whoToSee ? capitalize(whoToSee) : undefined,
    urgency: urgent ? "Now, not in the morning." : txt(raw.urgency, 60) || undefined,
    doctorNote: arr(raw.doctorNote).map((l) => txt(l, 200)).filter(Boolean).slice(0, 6),
    suggestTracking: raw.suggestTracking === true,
  };
  if (!result.explainer.length) result.explainer = ["Based on what you told us, we can't say much more without a doctor looking. This isn't a diagnosis."];
  if (!result.dont.length) result.dont = ["Don't take medicine that wasn't prescribed for you.", "Don't keep searching worst cases tonight."];
  if (!result.doctorNote.length) result.doctorNote = lines.map((l) => l.slice(2));
  return { result, urgent };
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
