import type { CheckInput, DailyEntry, Result, TrendResult, Worry } from "./types";
import { exampleSeries, one } from "./util";

// Source (AAD, "How to treat dandruff"): look for shampoos with zinc pyrithione,
// salicylic acid, sulfur, selenium sulfide, ketoconazole or coal tar; some need
// 5–10 minutes on the scalp; fine/oily hair → dandruff shampoo about twice a week,
// coarse/curly hair → about once a week; see a dermatologist if it doesn't go away
// or is severe (could be seborrhoeic dermatitis, psoriasis, a fungal infection or eczema).

function evaluate({ answers }: CheckInput): Result {
  const flakes = one(answers, "flakes"); // light | heavy
  const tried = one(answers, "tried"); // none | some | weeks
  const other = (answers.other ?? []).filter((o) => o !== "none");

  const red = other.includes("red");
  const beyond = other.includes("beyond");
  const hairloss = other.includes("hairloss");
  const sore = other.includes("sore");
  const notWorking = tried === "weeks";

  const redFlags = [
    { text: "Red, thick or crusty patches, or very itchy plaques", hit: red },
    { text: "Flaking on the face, eyebrows, ears or chest too", hit: beyond },
    { text: "Sore, oozing or painful scalp", hit: sore },
    { text: "Patchy hair loss along with the flakes", hit: hairloss },
    { text: "No better after several weeks of dandruff shampoo", hit: notWorking },
  ];

  const doctorNote = [
    `Flaking: ${flakes === "heavy" ? "heavy, visible on clothes" : "light"}.`,
    `Tried: ${TRIED[tried ?? ""] ?? "not sure"}.`,
    other.length ? `Also: ${other.map((o) => OTHER[o]).join("; ")}.` : "Scalp otherwise fine.",
  ];

  const shampoo =
    "On your next wash, use a dandruff shampoo (zinc pyrithione, selenium sulfide or ketoconazole on the label). Lather it into the scalp, not the lengths, and leave it on for 5 minutes before rinsing.";

  if (red || sore || hairloss || notWorking || beyond) {
    return {
      verdict: "doctor",
      headline: "This might be more than dandruff. A dermatologist can tell.",
      explainer: [
        "Ordinary dandruff responds to the right shampoo. When it doesn't, or comes with red patches, soreness or flaking beyond the scalp, dermatologists check for things that look similar: seborrhoeic dermatitis, psoriasis, a fungal infection or eczema.",
        "All of these are common and treatable. They just need the right treatment, not a fourth shampoo brand.",
      ],
      redFlags,
      tryTonight: "Take a clear photo of the worst patch in daylight. It helps if it looks calmer on the day of the appointment.",
      whoToSee: "A dermatologist",
      doctorNote,
      sources: ["aadDandruff"],
      suggestTracking: true,
    };
  }

  if (flakes === "heavy" || tried === "some") {
    return {
      verdict: "watch",
      headline: "Classic dandruff. The fix is technique, not a new brand.",
      explainer: [
        "Most dandruff shampoos fail because they're rinsed off too fast. The active ingredient needs time on the scalp, often 5–10 minutes.",
        "How often depends on your hair: about twice a week for fine or oily hair, about once a week for coarse or curly hair.",
        "Dandruff isn't caused by being unclean, and oiling doesn't fix it.",
      ],
      redFlags,
      tryTonight: shampoo,
      whoToSee: "A dermatologist if it isn't better after a few weeks of doing this properly",
      doctorNote,
      sources: ["aadDandruff"],
      suggestTracking: true,
    };
  }

  return {
    verdict: "normal",
    headline: "A few flakes is normal. Your scalp sheds too.",
    explainer: [
      "Light flaking, especially in winter or when you're stressed, is very common.",
      "If it bothers you, a dandruff shampoo once or twice a week, left on for a few minutes, is usually all it takes.",
    ],
    redFlags,
    tryTonight: shampoo,
    doctorNote,
    sources: ["aadDandruff"],
    suggestTracking: false,
  };
}

const TRIED: Record<string, string> = {
  none: "nothing specific",
  some: "dandruff shampoo now and then",
  weeks: "dandruff shampoo properly for several weeks, no better",
};
const OTHER: Record<string, string> = {
  red: "red / thick / crusty patches",
  beyond: "flaking on face, brows, ears or chest",
  sore: "sore or oozing scalp",
  hairloss: "patchy hair loss",
};

function trend(entries: DailyEntry[]): TrendResult {
  const itch = (e: DailyEntry) => Number(e.values.itch ?? 1);
  const dots = entries.map((e) => (itch(e) <= 1 ? "good" : itch(e) === 2 ? "meh" : "bad")) as TrendResult["dots"];
  const series = entries.map((e, i) => ({ label: String(i + 1), value: itch(e) }));
  if (entries.length < 7) {
    return { verdict: "early", headline: `${entries.length} of 14 days logged.`, detail: ["Give it two washes before reading anything into it."], dots, series };
  }
  const bad = entries.slice(-7).filter((e) => itch(e) >= 3).length;
  const washes = entries.filter((e) => e.values.shampoo === true).length;
  return {
    verdict: bad >= 3 ? "watch" : "normal",
    headline: bad >= 3 ? `${bad} itchy days in the last 7.` : "Mostly calm this week.",
    detail: [
      washes ? `Dandruff shampoo used on ${washes} day${washes === 1 ? "" : "s"}.` : "No dandruff-shampoo days logged yet, so start there.",
      bad >= 3 ? "If it's still like this after a few weeks of proper use, see a dermatologist." : "Whatever you're doing, keep doing it.",
    ],
    dots,
    series,
  };
}

export const dandruff: Worry = {
  id: "dandruff",
  title: "Snow on my shoulders",
  whisper: "Why won't these flakes go away?",
  forWhom: "Anyone with an itchy, flaky scalp who's tried three shampoos already",
  blurb: "Why most dandruff shampoos 'don't work', and when it's something else.",
  check: "questions",
  questions: [
    {
      id: "flakes",
      prompt: "How bad are the flakes?",
      options: [
        { id: "light", label: "A few, now and then" },
        { id: "heavy", label: "Lots, I can see them on my clothes" },
      ],
    },
    {
      id: "tried",
      prompt: "Have you tried a dandruff shampoo?",
      options: [
        { id: "none", label: "Not really" },
        { id: "some", label: "On and off" },
        { id: "weeks", label: "Properly, for several weeks, no better" },
      ],
    },
    {
      id: "other",
      prompt: "Anything else going on?",
      multi: true,
      options: [
        { id: "red", label: "Red, thick or crusty patches" },
        { id: "beyond", label: "Flaking on face, eyebrows, ears or chest" },
        { id: "sore", label: "Sore or oozing scalp" },
        { id: "hairloss", label: "Patchy hair loss too" },
        { id: "none", label: "None of these", exclusive: true },
      ],
    },
  ],
  evaluate,
  tracker: {
    kind: "daily",
    days: 14,
    unitLabel: "day",
    prompt: "How's the scalp today?",
    fields: [
      {
        kind: "chips",
        id: "itch",
        label: "Itch & flakes",
        options: [
          { id: "1", label: "Calm", score: 1 },
          { id: "2", label: "A bit", score: 2 },
          { id: "3", label: "Bad", score: 3 },
        ],
      },
      { kind: "toggle", id: "shampoo", label: "Used dandruff shampoo (5 min)" },
    ],
    trend,
  },
  example: {
    persona: "Example: 29, sales manager, Chandigarh",
    context: "Winter flakes on dark shirts. Switched to leaving a ketoconazole shampoo on for 5 minutes, twice a week.",
    entries: exampleSeries([
      { itch: 3, shampoo: false },
      { itch: 3, shampoo: true },
      { itch: 3, shampoo: false },
      { itch: 2, shampoo: false },
      { itch: 3, shampoo: true },
      { itch: 2, shampoo: false },
      { itch: 2, shampoo: false },
      { itch: 2, shampoo: true },
      { itch: 1, shampoo: false },
      { itch: 2, shampoo: false },
      { itch: 1, shampoo: true },
      { itch: 1, shampoo: false },
      { itch: 1, shampoo: false },
      { itch: 1, shampoo: true },
    ]),
  },
};
