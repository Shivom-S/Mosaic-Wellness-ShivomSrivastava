import type { CheckInput, DailyEntry, Result, TrendResult, Worry } from "./types";
import { exampleSeries, one } from "./util";

// Sources:
// - AAP (HealthyChildren): after infancy a toddler's growth rate, and appetite,
//   slows down; it can take 10+ tastes before a new food is accepted; picky
//   eating is usually a normal developmental stage.
// - Seattle Children's: a new food may need to be offered 10–15 times.
// - CHOP: picky eating is developmentally normal ~2–4; red flags = extreme
//   unwillingness to taste anything new, extreme distress about non-preferred
//   foods, developing aversions to foods they used to eat.
// - AAP: no more than 16–24 oz (473–750 mL) of milk a day after age 1; milk
//   fills toddlers up and is low in iron.

function evaluate({ answers }: CheckInput): Result {
  const age = one(answers, "age");
  const growth = one(answers, "growth"); // ok | unknown | flagged
  const pattern = one(answers, "pattern");
  const other = (answers.other ?? []).filter((o) => o !== "none");

  const flagged = growth === "flagged";
  const gag = other.includes("gag");
  const pain = other.includes("pain");
  const unwell = other.includes("unwell");
  const dropping = other.includes("dropping");
  const meltdown = other.includes("meltdown");
  const milk = other.includes("milk") || pattern === "milk";

  const redFlags = [
    { text: "Losing weight, or the doctor has flagged their growth", hit: flagged },
    { text: "Gagging, choking or vomiting with food, often", hit: gag },
    { text: "Seems to be in pain when eating or swallowing", hit: pain },
    { text: "Unwell: fever, fewer wet nappies, unusually sleepy", hit: unwell },
    { text: "Dropping foods they used to eat, or extreme distress about food", hit: dropping || meltdown },
  ];

  const doctorNote = [
    `Child's age: ${AGE[age ?? ""] ?? "not given"}.`,
    `Pattern: ${PATTERN[pattern ?? ""] ?? "not given"}.`,
    `Growth: ${growth === "ok" ? "doctor says on track" : growth === "flagged" ? "weight loss or growth concern flagged" : "not checked recently"}.`,
    other.length ? `Also: ${other.map((o) => OTHER[o]).join("; ")}.` : "No gagging, pain, illness or loss of foods reported.",
  ];

  const tryTonight =
    "Put one small spoon of the new food next to a food they already like, and then say nothing about it. Your job is what's served and when. Their job is whether to eat it and how much.";

  if (flagged || gag || pain || unwell) {
    return {
      verdict: "doctor",
      headline: unwell ? "If they're unwell, the food can wait. Call the paediatrician." : "This one's worth the paediatrician.",
      explainer: [
        unwell
          ? "Not eating while unwell, especially with fewer wet nappies or unusual sleepiness, is about the illness, not picky eating. A doctor should see them."
          : "Most picky eating is a normal phase. What you've described is on the list that's worth a doctor's look, to rule out something physical making food hard.",
        "Bring the doctor-ready summary below. It saves ten minutes of ‘umm, since when?’.",
      ],
      redFlags,
      tryTonight: unwell ? "Keep offering fluids little and often." : tryTonight,
      whoToSee: "Your child's paediatrician",
      urgency: unwell ? "Today if they're drinking very little or very drowsy." : undefined,
      doctorNote,
      sources: ["aapPicky", "chopPicky"],
      suggestTracking: !unwell,
    };
  }

  if (dropping || meltdown) {
    return {
      verdict: "watch",
      headline: "Mostly normal, with one thing to watch.",
      explainer: [
        "Picky eating is a normal stage between about 2 and 4. Dropping foods they used to eat, or real distress around food, goes a little past typical picky eating.",
        "Feeding specialists help with exactly this, and early help is easier than late. Mention it at the next paediatrician visit.",
      ],
      redFlags,
      tryTonight,
      whoToSee: "Your paediatrician, who may refer you to a feeding specialist",
      doctorNote,
      sources: ["chopPicky", "aapPicky"],
      suggestTracking: true,
    };
  }

  if (milk) {
    return {
      verdict: "watch",
      headline: "The milk might be doing the eating.",
      explainer: [
        "Milk is filling. The AAP's guidance is no more than 16–24 oz (about 470–750 ml, or 2–3 glasses) a day after the first birthday. More than that crowds out food, and milk is low in iron.",
        "Many ‘won't eat anything’ toddlers are simply full. Cut back slowly and appetite often comes back within days.",
      ],
      redFlags,
      tryTonight: "Offer milk with or after meals, not in the hour before. Hungry is the best seasoning.",
      whoToSee: "Your paediatrician if appetite doesn't improve after cutting back",
      doctorNote,
      sources: ["aapMilk", "aapPicky"],
      suggestTracking: true,
    };
  }

  return {
    verdict: "normal",
    headline: "Annoying? Yes. Normal? Very.",
    explainer: [
      "After the first year, a toddler's growth slows down, and so does their appetite. A child who ate everything at 10 months and refuses dal at 2 is following the textbook.",
      "New foods can take 10–15 tries before they're accepted. Most parents give up after three, so keep going.",
      growth === "ok"
        ? "Their doctor says growth is on track, and that's the number that actually matters."
        : "Growth is the number that actually matters. Ask for a weight and height check at the next paediatrician visit, just for peace of mind.",
    ],
    redFlags,
    tryTonight,
    doctorNote,
    sources: ["aapPicky", "seattlePicky", "chopPicky"],
    suggestTracking: true,
  };
}

const AGE: Record<string, string> = { "1to2": "1–2 years", "2to3": "2–3 years", "3to5": "3–5 years" };
const PATTERN: Record<string, string> = {
  few: "eats only a few foods",
  swings: "eats lots one day, almost nothing the next",
  refuses: "refuses whole meals",
  milk: "mostly wants milk",
};
const OTHER: Record<string, string> = {
  gag: "gags/chokes/vomits with food often",
  pain: "seems in pain while eating",
  unwell: "unwell (fever / fewer wet nappies / drowsy)",
  dropping: "dropping foods they used to eat",
  meltdown: "extreme distress about food",
  milk: "drinks a lot of milk",
};

function trend(entries: DailyEntry[]): TrendResult {
  const score = (e: DailyEntry) =>
    ["breakfast", "lunch", "dinner"].reduce((s, k) => s + Number(e.values[k] ?? 1), 0);
  const scores = entries.map(score);
  const dots = scores.map((s) => (s >= 6 ? "good" : s >= 4 ? "meh" : "bad")) as TrendResult["dots"];
  const newTries = entries.filter((e) => e.values.tried === true).length;
  const series = entries.map((e, i) => ({ label: String(i + 1), value: score(e) }));

  if (entries.length < 4) {
    return {
      verdict: "early",
      headline: `${entries.length} of 7 days logged.`,
      detail: ["Toddlers make sense over a week, not a meal. Keep logging."],
      dots,
      series,
    };
  }

  const good = scores.filter((s) => s >= 6).length;
  const bad = scores.filter((s) => s <= 3).length;
  return {
    verdict: good >= 2 || bad <= entries.length / 2 ? "normal" : "watch",
    headline:
      good >= 2
        ? `${good} good days out of ${entries.length}. That balances out.`
        : "Mostly light-eating days this week.",
    detail: [
      good >= 2
        ? "Toddler intake swings wildly day to day and evens out over the week. Your log shows exactly that."
        : "A light week happens, especially when they're teething or unwell. If it keeps up, or you're worried about their weight, see the paediatrician.",
      newTries
        ? `New food offered on ${newTries} day${newTries === 1 ? "" : "s"}. Keep going, because it can take 10–15 tries.`
        : "Try offering one new food at least 3 times this week, with zero pressure.",
    ],
    dots,
    series,
  };
}

export const toddler: Worry = {
  id: "toddler",
  title: "My toddler won't eat",
  whisper: "Is my child eating enough?",
  forWhom: "Parents of 1–5 year olds who've started negotiating over every spoonful",
  blurb: "Find out whether it's a phase, or worth the paediatrician.",
  check: "questions",
  questions: [
    {
      id: "age",
      prompt: "How old is your little one?",
      options: [
        { id: "1to2", label: "1 – 2 years" },
        { id: "2to3", label: "2 – 3 years" },
        { id: "3to5", label: "3 – 5 years" },
      ],
    },
    {
      id: "pattern",
      prompt: "Which sounds most like mealtimes?",
      options: [
        { id: "few", label: "Eats the same 3 things, refuses the rest" },
        { id: "swings", label: "Eats loads one day, nothing the next" },
        { id: "refuses", label: "Refuses whole meals" },
        { id: "milk", label: "Mostly just wants milk" },
      ],
    },
    {
      id: "growth",
      prompt: "What did the doctor say at the last check-up?",
      options: [
        { id: "ok", label: "Growth is on track" },
        { id: "unknown", label: "Haven't had it checked recently" },
        { id: "flagged", label: "They've lost weight / doctor flagged growth" },
      ],
    },
    {
      id: "other",
      prompt: "Anything else?",
      multi: true,
      options: [
        { id: "milk", label: "Drinks more than 3 glasses of milk a day" },
        { id: "dropping", label: "Stopped eating foods they used to like" },
        { id: "meltdown", label: "Real meltdowns about food, not just ‘no’" },
        { id: "gag", label: "Gags, chokes or vomits with food often" },
        { id: "pain", label: "Seems to hurt when eating or swallowing" },
        { id: "unwell", label: "Unwell: fever, fewer wet nappies, drowsy" },
        { id: "none", label: "None of these", exclusive: true },
      ],
    },
  ],
  evaluate,
  tracker: {
    kind: "daily",
    days: 7,
    unitLabel: "day",
    prompt: "Tap how each meal went. Ten seconds after dinner.",
    fields: [
      {
        kind: "chips",
        id: "breakfast",
        label: "Breakfast",
        options: [
          { id: "1", label: "Barely", score: 1 },
          { id: "2", label: "Some", score: 2 },
          { id: "3", label: "Ate well", score: 3 },
        ],
      },
      {
        kind: "chips",
        id: "lunch",
        label: "Lunch",
        options: [
          { id: "1", label: "Barely", score: 1 },
          { id: "2", label: "Some", score: 2 },
          { id: "3", label: "Ate well", score: 3 },
        ],
      },
      {
        kind: "chips",
        id: "dinner",
        label: "Dinner",
        options: [
          { id: "1", label: "Barely", score: 1 },
          { id: "2", label: "Some", score: 2 },
          { id: "3", label: "Ate well", score: 3 },
        ],
      },
      { kind: "toggle", id: "tried", label: "Offered something new" },
    ],
    trend,
  },
  example: {
    persona: "Example: parent of a 2½-year-old, Mumbai",
    context: "Convinced their son ‘eats nothing’. Logged a week of meals to show the paediatrician.",
    entries: exampleSeries([
      { breakfast: 1, lunch: 2, dinner: 1, tried: true },
      { breakfast: 3, lunch: 3, dinner: 2, tried: false },
      { breakfast: 1, lunch: 1, dinner: 2, tried: true },
      { breakfast: 2, lunch: 3, dinner: 3, tried: false },
      { breakfast: 1, lunch: 2, dinner: 1, tried: true },
      { breakfast: 3, lunch: 2, dinner: 3, tried: false },
      { breakfast: 2, lunch: 1, dinner: 3, tried: true },
    ]),
  },
};
