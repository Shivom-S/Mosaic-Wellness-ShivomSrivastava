// 1AM API: a tiny, privacy-first backend for Replit.
// Stores ONLY anonymous answer ratings: worry type, verdict type, "did it help", tone.
// No free text, no counts, no answers, no IPs, no user ids.
import { readFileSync } from "node:fs";
import express from "express";
import cors from "cors";
import pg from "pg";
import { aiProvider, understand } from "./intake.js";
import { aiAnswer, aiQuestions, checkProvider, looksUrgent, sanitizeCheck } from "./aicheck.js";

const PORT = process.env.PORT || 3000;
const ORIGINS = (process.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!process.env.DATABASE_URL) console.warn("DATABASE_URL is not set. Add a PostgreSQL database in Replit.");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 5,
});

const WORRIES = JSON.parse(readFileSync(new URL("./worries.json", import.meta.url), "utf8")).map((w) => w.id);
const RATED = [...WORRIES, "ai"]; // "ai" = an AI-built check for an uncovered worry
const VERDICTS = ["normal", "watch", "doctor"];
const ANSWERS = ["yes", "sort-of", "no"];
const TONES = ["cautious", "vague", "right"];

async function migrate() {
  await pool.query(`
    create table if not exists ratings (
      id bigserial primary key,
      created_at timestamptz not null default now(),
      worry text not null,
      verdict text not null,
      answer text not null,
      tone text
    );
    create index if not exists ratings_created_at on ratings (created_at);
  `);
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || ORIGINS.length === 0 || ORIGINS.includes(origin)),
    methods: ["GET", "POST"],
  }),
);

// Naive in-memory rate limit: 30 writes / 10 min per client (key isn't stored anywhere).
const hits = new Map();
const limited = (req) => {
  const k = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "?";
  const now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < 600_000);
  arr.push(now);
  hits.set(k, arr);
  return arr.length > 30;
};

app.get("/", (_req, res) => res.json({ ok: true, service: "1am-api", ai: Boolean(aiProvider) }));
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true, db: true, ai: aiProvider, checks: checkProvider });
  } catch {
    res.status(503).json({ ok: false, db: false, ai: aiProvider, checks: checkProvider });
  }
});

app.post("/api/ratings", async (req, res) => {
  if (limited(req)) return res.status(429).json({ error: "slow down" });
  const { worry, verdict, answer, tone } = req.body || {};
  if (!RATED.includes(worry) || !VERDICTS.includes(verdict) || !ANSWERS.includes(answer))
    return res.status(400).json({ error: "invalid" });
  if (tone != null && !TONES.includes(tone)) return res.status(400).json({ error: "invalid" });
  try {
    await pool.query("insert into ratings (worry, verdict, answer, tone) values ($1,$2,$3,$4)", [
      worry, verdict, answer, tone ?? null,
    ]);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db" });
  }
});

// AI intake. The text is used for this one request and never stored or logged.
app.post("/api/understand", async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "ai off" });
  if (limited(req)) return res.status(429).json({ error: "slow down" });
  const text = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, 500) : "";
  if (text.length < 3) return res.status(400).json({ error: "invalid" });
  try {
    const out = await understand(text);
    if (!out) return res.status(502).json({ error: "unreadable" });
    res.json(out);
  } catch (e) {
    console.error("ai error", String(e).slice(0, 200));
    res.status(502).json({ error: "ai" });
  }
});

// AI-built checks (Gemini/Claude) for worries without curated rules.
// Text and answers are used for the request only; nothing here is stored or logged.
const aiText = (req) => (typeof req.body?.text === "string" ? req.body.text.trim().slice(0, 500) : "");

app.post("/api/ai/questions", async (req, res) => {
  if (!checkProvider) return res.status(503).json({ error: "ai off" });
  if (limited(req)) return res.status(429).json({ error: "slow down" });
  const text = aiText(req);
  if (text.length < 3) return res.status(400).json({ error: "invalid" });
  if (looksUrgent(text)) return res.json({ health: true, urgent: true, questions: [] });
  try {
    res.json(await aiQuestions(text));
  } catch (e) {
    console.error("ai questions error", String(e).slice(0, 200));
    res.status(502).json({ error: "ai" });
  }
});

app.post("/api/ai/answer", async (req, res) => {
  if (!checkProvider) return res.status(503).json({ error: "ai off" });
  if (limited(req)) return res.status(429).json({ error: "slow down" });
  const text = aiText(req);
  const check = sanitizeCheck(req.body?.check);
  const answers = req.body?.answers && typeof req.body.answers === "object" ? req.body.answers : {};
  if (!check) return res.status(400).json({ error: "invalid" });
  try {
    res.json(await aiAnswer(text, check, answers));
  } catch (e) {
    console.error("ai answer error", String(e).slice(0, 200));
    res.status(502).json({ error: "ai" });
  }
});

// Aggregate "pulse" over the last 30 days. Only counts, never rows.
app.get("/api/pulse", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      select worry, verdict, answer, count(*)::int as n
      from ratings where created_at > now() - interval '30 days'
      group by worry, verdict, answer`);
    const total = rows.reduce((s, r) => s + r.n, 0);
    const helped = rows.filter((r) => r.answer === "yes").reduce((s, r) => s + r.n, 0);
    const byWorry = Object.fromEntries(WORRIES.map((w) => [w, 0]));
    const byVerdict = Object.fromEntries(VERDICTS.map((v) => [v, 0]));
    for (const r of rows) {
      if (r.worry in byWorry) byWorry[r.worry] += r.n;
      byVerdict[r.verdict] += r.n;
    }
    res.set("Cache-Control", "public, max-age=60");
    res.json({ windowDays: 30, total, helpedPct: total ? Math.round((helped / total) * 100) : null, byWorry, byVerdict });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db" });
  }
});

migrate()
  .catch((e) => console.error("migration failed", e))
  .finally(() => app.listen(PORT, "0.0.0.0", () => console.log(`1am-api on :${PORT}`)));
