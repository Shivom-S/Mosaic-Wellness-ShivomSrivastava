// Shared types for 1AM's worry content + verdict engine.
// All verdict logic is deterministic (no AI) so the app never breaks and every
// answer can be traced to a cited threshold.

export type WorryId = "hair" | "cycle" | "sleep" | "toddler" | "acne" | "dandruff" | "reflux";

export type Verdict = "normal" | "watch" | "doctor";

export interface Source {
  id: string;
  org: string; // e.g. "American Academy of Dermatology"
  title: string;
  url: string;
}

export interface Option {
  id: string;
  label: string;
  hint?: string;
  /** For multi-select questions: selecting this clears the others ("None of these"). */
  exclusive?: boolean;
}

export interface Question {
  id: string;
  prompt: string;
  help?: string;
  multi?: boolean;
  options: Option[];
}

/** Answers keyed by question id. Single-select → [optionId]; multi → many. */
export type Answers = Record<string, string[]>;

/** Hair-only: what the person counted in the tap-to-count ritual. */
export interface HairCount {
  pillow: number;
  comb: number;
  drain: number;
  elsewhere: number;
}

export interface CheckInput {
  answers: Answers;
  count?: HairCount;
}

export interface Result {
  verdict: Verdict;
  /** One-line, human, slightly warm. Shown huge on the verdict card. */
  headline: string;
  /** "What's probably going on" — 2–4 short sentences, plain language. */
  explainer: string[];
  /** Red flags. `hit: true` = the person reported this one. */
  redFlags: { text: string; hit: boolean }[];
  /** One concrete thing to try tonight. */
  tryTonight: string;
  /** Who to see, if anyone. */
  whoToSee?: string;
  /** Extra urgency nudge, e.g. "soon, not someday". */
  urgency?: string;
  /** Lines for the doctor-ready summary. */
  doctorNote: string[];
  /** Source ids backing the numbers used. */
  sources: string[];
  /** Should we suggest tracking? */
  suggestTracking: boolean;
}

// ---------- Tracking ----------

export interface ChipField {
  kind: "chips";
  id: string;
  label: string;
  options: { id: string; label: string; score: number }[];
}
export interface NumberField {
  kind: "number";
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}
export interface ToggleField {
  kind: "toggle";
  id: string;
  label: string;
}
export type Field = ChipField | NumberField | ToggleField;

export interface DailyEntry {
  /** ISO date, yyyy-mm-dd */
  date: string;
  values: Record<string, number | string | boolean>;
}

export interface TrendResult {
  verdict: Verdict | "early";
  headline: string;
  detail: string[];
  /** Per-day status for the dot strip, aligned to entries. */
  dots: ("good" | "meh" | "bad")[];
  /** Optional series for a tiny chart. */
  series?: { label: string; value: number }[];
  /** Optional reference line for the chart, e.g. 100 hairs. */
  reference?: { value: number; label: string };
}

export interface DailyTracker {
  kind: "daily";
  days: number; // 14 or 7
  unitLabel: string; // "day" / "night"
  prompt: string; // shown on the log screen
  fields: Field[];
  trend: (entries: DailyEntry[]) => TrendResult;
}

export interface DatesTracker {
  kind: "dates";
  prompt: string;
  /** entries' `date` = each period start date */
  trend: (entries: DailyEntry[]) => TrendResult;
}

export type Tracker = DailyTracker | DatesTracker;

export interface ExampleStory {
  /** Always shown with an "Example" label. Never presented as a real user. */
  persona: string;
  context: string;
  entries: DailyEntry[];
}

export interface Worry {
  id: WorryId;
  /** Card title, plain words. */
  title: string;
  /** The 1 AM version of the thought, in quotes on the card. */
  whisper: string;
  /** Who this is for, one line. */
  forWhom: string;
  /** Short line under the title. */
  blurb: string;
  check: "count" | "questions";
  questions: Question[];
  evaluate: (input: CheckInput) => Result;
  tracker: Tracker;
  example: ExampleStory;
}
