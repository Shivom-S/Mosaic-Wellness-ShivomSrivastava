import type { CheckInput, DailyEntry, Result, TrendResult, Worry } from "./types";
import { avg, daysAgo, daysBetween, one } from "./util";

// Thresholds:
// - Cleveland Clinic: periods fewer than 21 or more than 35 days apart, or a
//   cycle length that varies by more than 9 days, count as irregular. Heavy =
//   soaking a pad/tampon every hour for 2–3 hours; bleeding > 7 days.
// - ACOG (adolescents): in the first years after the first period, cycles of
//   21–45 days are typical; bleeding usually lasts 7 days or less.

function evaluate({ answers }: CheckInput): Result {
  const stage = one(answers, "stage"); // early | adult | forties
  const gap = one(answers, "gap"); // lt21 | 21to35 | 36to45 | gt45 | none3m | unknown
  const vary = one(answers, "vary"); // steady | varies | unknown
  const other = (answers.other ?? []).filter((o) => o !== "none");

  const soaking = other.includes("soaking");
  const long = other.includes("long");
  const between = other.includes("between");
  const pain = other.includes("pain");
  const androgen = other.includes("androgen");
  const pregnant = other.includes("pregnant");
  const missing = gap === "none3m";

  const early = stage === "early";
  const forties = stage === "forties";
  const upper = early ? 45 : 35;

  const outOfRange =
    gap === "lt21" || gap === "gt45" || (!early && gap === "36to45");
  const varies = vary === "varies" || gap === "unknown";

  const redFlags = [
    { text: "Soaking through a pad or tampon every hour for 2–3 hours", hit: soaking },
    { text: "Bleeding for more than 7 days", hit: long },
    { text: "Bleeding between periods or after sex", hit: between },
    { text: "No period for 3+ months, and you're not pregnant", hit: missing },
    { text: "Pain bad enough to stop you doing your normal day", hit: pain },
  ];

  const doctorNote = [
    `Stage: ${early ? "within ~3 years of first period" : forties ? "40s or later" : "more than 3 years since first period"}.`,
    `Usual gap between period starts: ${GAP[gap ?? "unknown"]}.`,
    `Month-to-month variation: ${vary === "steady" ? "within about a week" : vary === "varies" ? "more than 9 days" : "not sure"}.`,
    other.length ? `Also noticed: ${other.map((o) => OTHER[o]).join("; ")}.` : "No heavy bleeding, bleeding between periods or severe pain.",
  ];

  const sources = ["ccIrregular", ...(early ? ["acogTeens"] : [])];
  const pregnancyLine = pregnant
    ? "If there's any chance you're pregnant, take a home pregnancy test first. A late or missed period is often just that."
    : null;

  const urgent = soaking;
  const flagged = soaking || long || between || missing || pain;

  if (flagged) {
    return {
      verdict: "doctor",
      headline: urgent ? "Heavy bleeding like that shouldn't wait." : "This one is worth a gynaecologist visit.",
      explainer: [
        ...(pregnancyLine ? [pregnancyLine] : []),
        urgent
          ? "Soaking through a pad or tampon every hour for 2–3 hours is beyond normal heavy flow. See a doctor soon, and go to emergency care if you feel dizzy or faint."
          : "What you've described is on the standard list of things doctors want to hear about. It doesn't mean something is badly wrong. It means a doctor needs to look before anyone can say.",
        "Gynaecologists hear about periods all day. Nothing you say will be awkward for them.",
      ],
      redFlags,
      tryTonight: "Open your calendar or photos and write down your last 3–4 period start dates, roughly. That's the first thing a doctor will ask.",
      whoToSee: "A gynaecologist",
      urgency: urgent ? "Soon, not someday." : undefined,
      doctorNote,
      sources,
      suggestTracking: true,
    };
  }

  if (androgen && (outOfRange || varies)) {
    return {
      verdict: "doctor",
      headline: "Irregular cycles plus those signs: ask about PCOS.",
      explainer: [
        "Irregular or long cycles, together with acne, extra facial or body hair, or weight changes you can't explain, are the combination doctors check for polycystic ovary syndrome (PCOS).",
        "PCOS is common, and very manageable once someone actually names it. Getting checked is how you stop guessing.",
      ],
      redFlags,
      tryTonight: "Write down your last few period start dates and when the skin, hair or weight changes began. That's most of a first appointment right there.",
      whoToSee: "A gynaecologist or endocrinologist",
      doctorNote,
      sources,
      suggestTracking: true,
    };
  }

  if (outOfRange || varies) {
    return {
      verdict: "watch",
      headline: early
        ? "A bit irregular, which is common this early on."
        : forties
          ? "Cycles often shift in your 40s. Keep an eye on it."
          : "Slightly outside the usual range. Worth tracking.",
      explainer: [
        ...(pregnancyLine ? [pregnancyLine] : []),
        early
          ? `In the first few years after your first period, cycles anywhere from 21 to ${upper} days are typical, and they can jump around while your body settles.`
          : `Cycles 21–35 days apart, varying by no more than about 9 days, are the usual range. ${gap === "unknown" ? "\"No idea\" usually means it's varying, or you haven't been keeping track." : "Yours sits outside that."}`,
        forties
          ? "As you approach menopause, cycles commonly get shorter, longer or less predictable. Mention it at your next check-up."
          : "Stress, exams, travel, illness and big changes in weight or exercise can all throw a cycle off for a month or two.",
        "Logging a few start dates turns a hunch into an answer.",
      ],
      redFlags,
      tryTonight: "Log your last period start date in the tracker, plus any earlier ones you can remember. Three dates are enough for us to calculate your real cycle length.",
      whoToSee: "A gynaecologist if it stays irregular for 3+ cycles",
      doctorNote,
      sources,
      suggestTracking: true,
    };
  }

  return {
    verdict: "normal",
    headline: "That sounds like a normal cycle.",
    explainer: [
      ...(pregnancyLine ? [pregnancyLine] : []),
      early
        ? `Cycles of 21–${upper} days are typical in the first few years. Yours sounds like it's in range.`
        : "Periods that start 21–35 days apart and vary by no more than about 9 days are the textbook definition of regular. A cycle doesn't have to be exactly 28 days.",
      "Being a few days early or late now and then is normal.",
    ],
    redFlags,
    tryTonight: "Nothing to fix. If you want to see it for yourself, log your start dates and we'll show you your real average.",
    doctorNote,
    sources,
    suggestTracking: false,
  };
}

const GAP: Record<string, string> = {
  lt21: "less than 21 days",
  "21to35": "21–35 days",
  "36to45": "36–45 days",
  gt45: "more than 45 days",
  none3m: "no period in 3+ months",
  unknown: "unpredictable / not sure",
};

const OTHER: Record<string, string> = {
  soaking: "soaking a pad/tampon every hour for 2–3 hours",
  long: "bleeding more than 7 days",
  between: "bleeding between periods or after sex",
  pain: "pain that stops normal activities",
  androgen: "acne, extra facial/body hair or unexplained weight change",
  pregnant: "could be pregnant",
};

function trend(entries: DailyEntry[]): TrendResult {
  const dates = entries.map((e) => e.date).sort();
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) gaps.push(daysBetween(dates[i - 1], dates[i]));
  const dots = gaps.map((g) => (g >= 21 && g <= 35 ? "good" : g <= 45 ? "meh" : "bad")) as TrendResult["dots"];
  const series = gaps.map((g, i) => ({ label: `C${i + 1}`, value: g }));

  if (gaps.length < 2) {
    return {
      verdict: "early",
      headline:
        dates.length === 0
          ? "Add your last period start date."
          : dates.length === 1
            ? "One date in. Add an earlier one."
            : `One cycle: ${gaps[0]} days.`,
      detail: ["With three start dates we can calculate two cycles and see how much they vary."],
      dots,
      series,
    };
  }

  const mean = Math.round(avg(gaps));
  const spread = Math.max(...gaps) - Math.min(...gaps);
  const inRange = gaps.every((g) => g >= 21 && g <= 35);
  const steady = spread <= 9;

  if (inRange && steady) {
    return {
      verdict: "normal",
      headline: `Average ${mean} days, steady. Textbook regular.`,
      detail: [
        `Your cycles ranged from ${Math.min(...gaps)} to ${Math.max(...gaps)} days. Within 21–35 and varying ${spread} days, under the 9-day mark.`,
      ],
      dots,
      series,
    };
  }

  const odd = gaps.filter((g) => g < 21 || g > 35);
  const rest = gaps.filter((g) => g >= 21 && g <= 35);
  const restSteady = rest.length >= 2 && Math.max(...rest) - Math.min(...rest) <= 9;
  if (odd.length === 1 && restSteady) {
    return {
      verdict: "watch",
      headline: `Mostly regular, with one outlier of ${odd[0]} days.`,
      detail: [
        `Leaving out that one cycle, yours ran ${Math.min(...rest)}–${Math.max(...rest)} days, which is steady and in range.`,
        "One odd cycle is common after stress, illness, travel or exams. If the next one is off too, that's when to see a gynaecologist.",
      ],
      dots,
      series,
    };
  }

  return {
    verdict: gaps.length >= 3 ? "doctor" : "watch",
    headline: `Average ${mean} days, varying by ${spread}.`,
    detail: [
      !inRange
        ? "At least one cycle fell outside 21–35 days."
        : `A ${spread}-day swing is more than the usual 9.`,
      gaps.length >= 3
        ? "Several cycles in a row like this are worth showing a gynaecologist. Take this list with you."
        : "One odd cycle happens to everyone. Keep logging, and if the next ones look like this too, see a gynaecologist.",
    ],
    dots,
    series,
  };
}

export const cycle: Worry = {
  id: "cycle",
  title: "Period's late, again",
  whisper: "Is my cycle normal?",
  forWhom: "Anyone who gets periods and is wondering whether theirs is normal",
  blurb: "Four taps against the ranges gynaecologists actually use.",
  check: "questions",
  questions: [
    {
      id: "stage",
      prompt: "Where are you in life, period-wise?",
      help: "Normal ranges are different in the first few years.",
      options: [
        { id: "early", label: "Less than ~3 years since my first period" },
        { id: "adult", label: "More than 3 years in" },
        { id: "forties", label: "I'm in my 40s or older" },
      ],
    },
    {
      id: "gap",
      prompt: "Usually, how many days from one period starting to the next?",
      help: "Count from day 1 of one period to day 1 of the next.",
      options: [
        { id: "lt21", label: "Less than 21 days" },
        { id: "21to35", label: "21 – 35 days" },
        { id: "36to45", label: "36 – 45 days" },
        { id: "gt45", label: "More than 45 days" },
        { id: "none3m", label: "No period in 3+ months" },
        { id: "unknown", label: "No idea, it's all over the place" },
      ],
    },
    {
      id: "vary",
      prompt: "How much does that change from month to month?",
      options: [
        { id: "steady", label: "Pretty steady, within about a week" },
        { id: "varies", label: "Swings by more than 9 days" },
        { id: "unknown", label: "Not sure" },
      ],
    },
    {
      id: "other",
      prompt: "Anything else going on?",
      multi: true,
      options: [
        { id: "soaking", label: "Soaking a pad/tampon every hour for 2–3 hrs" },
        { id: "long", label: "Bleeding more than 7 days" },
        { id: "between", label: "Bleeding between periods or after sex" },
        { id: "pain", label: "Pain that stops my normal day" },
        { id: "androgen", label: "Acne, extra facial/body hair or weight changes I can't explain" },
        { id: "pregnant", label: "There's a chance I'm pregnant" },
        { id: "none", label: "None of these", exclusive: true },
      ],
    },
  ],
  evaluate,
  tracker: {
    kind: "dates",
    prompt: "Add the day each period started. Past ones from memory are fine.",
    trend,
  },
  example: {
    persona: "Example: 27, final-year MBA student, Delhi",
    context: "Logged five period start dates from her calendar during exam season, after a 41-day cycle had her panicking.",
    entries: [
      { date: daysAgo(150), values: {} },
      { date: daysAgo(121), values: {} },
      { date: daysAgo(90), values: {} },
      { date: daysAgo(49), values: {} },
      { date: daysAgo(18), values: {} },
    ],
  },
};
