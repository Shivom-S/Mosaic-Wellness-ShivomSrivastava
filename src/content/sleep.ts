import type { CheckInput, DailyEntry, Result, TrendResult, Worry } from "./types";
import { exampleSeries, one } from "./util";

// Thresholds:
// - NSF / OSU Wexner: most people wake at least once a night and fall back
//   asleep easily. Chronic insomnia = trouble at least 3 nights a week for at
//   least 3 months (with daytime impact).
// - AASM: CBT-I is the recommended treatment for chronic insomnia in adults.
// - Stanford stimulus control: if you can't get back to sleep in 15–20 min,
//   get up, go somewhere else, do something quiet, come back when sleepy.

function evaluate({ answers }: CheckInput): Result {
  const freq = one(answers, "freq"); // rare | some | most
  const dur = one(answers, "dur"); // lt1 | 1to3 | gt3
  const awake = one(answers, "awake"); // quick | mid | long
  const day = one(answers, "day"); // fine | tired | impact
  const other = (answers.other ?? []).filter((o) => o !== "none");

  const apnea = other.includes("snore");
  const mood = other.includes("mood");
  const chronic = freq === "most" && dur === "gt3";
  const frequent = freq === "most";
  const impact = day === "impact";
  const struggle = awake === "mid" || awake === "long";

  const redFlags = [
    { text: "Loud snoring, gasping or choking in your sleep (ask whoever hears you)", hit: apnea },
    { text: "Trouble 3+ nights a week for 3+ months", hit: chronic },
    { text: "So sleepy in the day it affects work, mood or driving", hit: impact },
    { text: "Low mood or anxiety most days, not just at night", hit: mood },
  ];

  const doctorNote = [
    `Waking in the night: ${FREQ[freq ?? ""] ?? "not sure"}, for ${DUR[dur ?? ""] ?? "not sure"}.`,
    `Time awake when it happens: ${AWAKE[awake ?? ""] ?? "not sure"}.`,
    `Daytime: ${DAY[day ?? ""] ?? "not sure"}.`,
    other.length ? `Also: ${other.map((o) => OTHER[o]).join("; ")}.` : "No snoring/gasping, reflux, night-time peeing or hot flushes reported.",
  ];

  const getUp =
    "If you've been lying awake about 20 minutes, get up. Go to another room, keep the light dim and do something boring, like folding clothes or reading a paper book. Go back to bed when you feel sleepy. Turn the clock to face the wall.";

  const contributors = other
    .filter((o) => CONTRIB[o])
    .map((o) => CONTRIB[o]);

  if (apnea && (impact || day === "tired")) {
    return {
      verdict: "doctor",
      headline: "Snoring plus daytime tiredness: get checked for sleep apnoea.",
      explainer: [
        "Waking up a lot, loud snoring or gasping, and being tired the next day together are the classic reason doctors check for sleep apnoea, where breathing keeps pausing during sleep.",
        "It's very common, it's often missed, and treating it can change how your days feel.",
      ],
      redFlags,
      tryTonight: "Ask your partner or roommate to note whether you snore loudly or seem to stop breathing. Or record a night's audio on your phone.",
      whoToSee: "A doctor; ask about a sleep study",
      doctorNote,
      sources: ["osuWaking", "nsfInsomnia"],
      suggestTracking: true,
    };
  }

  if (chronic || (frequent && impact) || mood) {
    return {
      verdict: "doctor",
      headline: chronic ? "That's past ‘a phase’. It's treatable." : "This is worth talking to a doctor about.",
      explainer: [
        chronic
          ? "Trouble sleeping at least 3 nights a week for at least 3 months is how sleep doctors define chronic insomnia. You're there."
          : mood
            ? "Low mood or anxiety most days and broken sleep tend to feed each other. A doctor can help with both together."
            : "Waking most nights and feeling it during the day deserves more than tips from an app.",
        "The good news: the recommended first treatment is CBT-I, a short, structured therapy that retrains sleep, not sleeping pills. It works for most people.",
        ...contributors,
      ],
      redFlags,
      tryTonight: getUp,
      whoToSee: "A doctor; ask about CBT-I (cognitive behavioural therapy for insomnia)",
      doctorNote,
      sources: ["nsfInsomnia", "aasmInsomnia", "stanfordStimulus"],
      suggestTracking: true,
    };
  }

  if (frequent || struggle || impact) {
    return {
      verdict: "watch",
      headline: "Not insomnia yet, but worth getting ahead of.",
      explainer: [
        "Doctors call it chronic insomnia at 3+ bad nights a week for 3+ months. You're not there, and short bouts usually follow stress and pass on their own.",
        "The trap is lying in bed awake, which teaches your brain that bed is where you worry. The fix is surprisingly behavioural.",
        ...contributors,
      ],
      redFlags,
      tryTonight: getUp,
      whoToSee: "A doctor if it's still 3+ nights a week after 3 months, or sooner if your days are suffering",
      doctorNote,
      sources: ["nsfInsomnia", "osuWaking", "stanfordStimulus"],
      suggestTracking: true,
    };
  }

  return {
    verdict: "normal",
    headline: "Waking at 3 AM sometimes is normal. Annoying, but normal.",
    explainer: [
      "Sleep runs in cycles, and between them you briefly come close to waking. Most people wake at least once a night. The ones who say they don't just don't remember it.",
      "Falling back asleep easily, and feeling fine the next day, is exactly what healthy sleep looks like.",
      ...contributors,
    ],
    redFlags,
    tryTonight: "Don't check the time when you wake. Knowing it's 3:12 AM starts the maths (‘only 4 hours left…’), and that's what keeps you up.",
    doctorNote,
    sources: ["osuWaking", "nsfInsomnia"],
    suggestTracking: false,
  };
}

const FREQ: Record<string, string> = { rare: "once in a while", some: "1–2 nights a week", most: "3+ nights a week" };
const DUR: Record<string, string> = { lt1: "less than a month", "1to3": "1–3 months", gt3: "3+ months" };
const AWAKE: Record<string, string> = { quick: "back asleep within minutes", mid: "20–60 minutes", long: "more than an hour" };
const DAY: Record<string, string> = { fine: "fine", tired: "tired but functioning", impact: "affecting work, mood or driving" };
const OTHER: Record<string, string> = {
  snore: "loud snoring / gasping",
  mood: "low mood or anxiety most days",
  racing: "racing thoughts",
  pee: "getting up to pee more than once",
  reflux: "reflux / heartburn",
  flush: "hot flushes or night sweats",
  phone: "phone in bed",
  caffeine: "caffeine after 3 PM",
};
const CONTRIB: Record<string, string> = {
  phone: "Phone in bed: the scrolling keeps your brain alert, more than the blue light does. Charge it outside the room for a week as an experiment.",
  caffeine: "Caffeine lasts hours. An evening chai or coffee can still be in your system at 3 AM. Try a 2 PM cutoff.",
  racing: "Racing thoughts: keep a notepad by the bed and write the worry down. Once it's on paper, your brain doesn't have to keep holding it.",
  reflux: "Reflux can wake you. A lighter, earlier dinner, at least 2–3 hours before bed, is worth trying.",
  pee: "Waking more than once a night to pee is worth mentioning to a doctor, especially if it's new.",
  flush: "Hot flushes and night sweats are worth mentioning to a doctor. They often have a specific, treatable cause.",
};

function trend(entries: DailyEntry[]): TrendResult {
  const isBad = (e: DailyEntry) => {
    const a = String(e.values.awake ?? "none");
    return a === "mid" || a === "long";
  };
  const dots = entries.map((e) => {
    const a = String(e.values.awake ?? "none");
    return a === "none" || a === "short" ? "good" : a === "mid" ? "meh" : "bad";
  }) as TrendResult["dots"];
  const restedScore = entries.map((e) => Number(e.values.rested ?? 2));
  const series = entries.map((e, i) => ({
    label: String(i + 1),
    value: AWAKE_MIN[String(e.values.awake ?? "none")] ?? 0,
  }));

  if (entries.length < 7) {
    return {
      verdict: "early",
      headline: `${entries.length} of 14 nights logged.`,
      detail: ["A week is the smallest unit sleep makes sense in. Keep going."],
      dots,
      series,
    };
  }

  const lastWeek = entries.slice(-7);
  const badLast = lastWeek.filter(isBad).length;
  const prevWeek = entries.slice(-14, -7);
  const badPrev = prevWeek.filter(isBad).length;
  const tired = restedScore.slice(-7).filter((s) => s === 1).length;

  if (badLast >= 3) {
    return {
      verdict: badPrev >= 3 ? "doctor" : "watch",
      headline: `${badLast} rough nights in the last 7.`,
      detail: [
        "Three or more a week is the insomnia threshold. If this keeps up for 3 months, it's chronic and very treatable with CBT-I.",
        badPrev >= 3
          ? "It was the same the week before. Talk to a doctor now. You don't have to wait the full 3 months."
          : "Last week was better, so this could be a stress blip. Keep using the get-up-after-20-minutes rule.",
      ],
      dots,
      series,
    };
  }

  return {
    verdict: "normal",
    headline: badPrev >= 3 ? `Better: ${badLast} rough night${badLast === 1 ? "" : "s"} this week, down from ${badPrev}.` : `${badLast} rough night${badLast === 1 ? "" : "s"} in the last 7. That's healthy.`,
    detail: [
      "Fewer than 3 rough nights a week is within normal for most adults.",
      tired >= 3 ? "You've still felt wrecked on several mornings. Think about total hours too: most adults need 7 or more." : "Mornings look okay too.",
    ],
    dots,
    series,
  };
}

const AWAKE_MIN: Record<string, number> = { none: 0, short: 10, mid: 40, long: 90 };

export const sleep: Worry = {
  id: "sleep",
  title: "Wide awake at 3 AM",
  whisper: "Why can't I sleep through the night?",
  forWhom: "Anyone who keeps waking up in the night and can't drift back off",
  blurb: "Find out whether it's a rough patch or worth a doctor.",
  check: "questions",
  questions: [
    {
      id: "freq",
      prompt: "How often are you up in the middle of the night?",
      options: [
        { id: "rare", label: "Once in a while" },
        { id: "some", label: "1–2 nights a week" },
        { id: "most", label: "3 or more nights a week" },
      ],
    },
    {
      id: "dur",
      prompt: "For how long has this been going on?",
      options: [
        { id: "lt1", label: "Less than a month" },
        { id: "1to3", label: "1 – 3 months" },
        { id: "gt3", label: "More than 3 months" },
      ],
    },
    {
      id: "awake",
      prompt: "When it happens, how long are you lying there?",
      options: [
        { id: "quick", label: "A few minutes, then I'm out" },
        { id: "mid", label: "20 minutes to an hour" },
        { id: "long", label: "More than an hour" },
      ],
    },
    {
      id: "day",
      prompt: "And the next day?",
      options: [
        { id: "fine", label: "Honestly fine" },
        { id: "tired", label: "Tired, but I manage" },
        { id: "impact", label: "It's hurting my work, mood or driving" },
      ],
    },
    {
      id: "other",
      prompt: "Any of these sound familiar?",
      multi: true,
      options: [
        { id: "racing", label: "Racing thoughts / worrying" },
        { id: "phone", label: "Phone in bed" },
        { id: "caffeine", label: "Chai or coffee after 3 PM" },
        { id: "reflux", label: "Acidity / heartburn at night" },
        { id: "pee", label: "Getting up to pee more than once" },
        { id: "flush", label: "Hot flushes or night sweats" },
        { id: "snore", label: "Loud snoring or gasping (someone's told me)" },
        { id: "mood", label: "Low mood or anxiety most days" },
        { id: "none", label: "None of these", exclusive: true },
      ],
    },
  ],
  evaluate,
  tracker: {
    kind: "daily",
    days: 14,
    unitLabel: "night",
    prompt: "Ten seconds, first thing in the morning.",
    fields: [
      {
        kind: "chips",
        id: "awake",
        label: "Up in the night?",
        options: [
          { id: "none", label: "Slept through", score: 0 },
          { id: "short", label: "Briefly", score: 1 },
          { id: "mid", label: "20–60 min", score: 2 },
          { id: "long", label: "1 hr+", score: 3 },
        ],
      },
      {
        kind: "chips",
        id: "rested",
        label: "How do you feel?",
        options: [
          { id: "1", label: "Wrecked", score: 1 },
          { id: "2", label: "Okay", score: 2 },
          { id: "3", label: "Good", score: 3 },
        ],
      },
    ],
    trend,
  },
  example: {
    persona: "Example: 31, new manager, Bengaluru",
    context: "Started waking at 3 AM after a promotion. Moved the phone out of the bedroom on night 6 and used the 20-minute rule.",
    entries: exampleSeries([
      { awake: "long", rested: 1 },
      { awake: "mid", rested: 1 },
      { awake: "long", rested: 1 },
      { awake: "short", rested: 2 },
      { awake: "mid", rested: 1 },
      { awake: "mid", rested: 2 },
      { awake: "short", rested: 2 },
      { awake: "mid", rested: 2 },
      { awake: "short", rested: 2 },
      { awake: "none", rested: 3 },
      { awake: "short", rested: 2 },
      { awake: "none", rested: 3 },
      { awake: "short", rested: 3 },
      { awake: "none", rested: 3 },
    ]),
  },
};
