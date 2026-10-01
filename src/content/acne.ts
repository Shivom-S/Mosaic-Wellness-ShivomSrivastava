import type { CheckInput, DailyEntry, Result, TrendResult, Worry } from "./types";
import { avg, exampleSeries, one } from "./util";

// Sources (AAD): OTC benzoyl peroxide, adapalene and salicylic acid help mild acne;
// any acne treatment needs 6–8 weeks to show fewer breakouts; switching products
// too often, scrubbing, sleeping in makeup and popping make acne worse; nodular
// (deep, painful) acne can scar and needs a dermatologist.

function evaluate({ answers }: CheckInput): Result {
  const type = one(answers, "type"); // few | many | deep
  const tried = one(answers, "tried"); // none | short | long
  const other = (answers.other ?? []).filter((o) => o !== "none");

  const deep = type === "deep";
  const scars = other.includes("scars");
  const mood = other.includes("mood");
  const sudden = other.includes("sudden");
  const failedLong = tried === "long";

  const redFlags = [
    { text: "Deep, painful lumps under the skin (nodules or cysts)", hit: deep },
    { text: "Spots leaving scars or dark marks", hit: scars },
    { text: "Nothing has helped after 6–8 weeks of steady use", hit: failedLong },
    { text: "It's getting you down or making you avoid people", hit: mood },
  ];

  const doctorNote = [
    `Type of breakout: ${TYPE[type ?? ""] ?? "not sure"}.`,
    `Treatment so far: ${TRIED[tried ?? ""] ?? "not sure"}.`,
    other.length ? `Also: ${other.map((o) => OTHER[o]).join("; ")}.` : "No scarring, sudden change or mood impact reported.",
  ];

  const routine =
    "Tonight: wash your face once, gently, with your fingertips (no scrub), remove any makeup, and leave the spots alone. Popping pushes bacteria deeper.";

  if (deep || scars || failedLong || mood) {
    return {
      verdict: "doctor",
      headline: deep ? "Deep, painful spots are dermatologist territory." : "Time to let a dermatologist take over.",
      explainer: [
        deep
          ? "Deep, painful lumps (nodular acne) don't respond well to drugstore creams and can leave scars. The AAD's advice is to treat it early, with a dermatologist."
          : scars
            ? "Breakouts that leave scars or dark marks are worth treating properly now. Early treatment is what prevents permanent scarring."
            : failedLong
              ? "You've given it 6–8 weeks, which is how long acne treatments take to work. If that hasn't helped, prescription options are the next step."
              : "Acne that's affecting your mood is a real reason to get help, not vanity. Dermatologists treat this every day.",
        "There are effective prescription treatments. You don't have to keep guessing at the chemist.",
      ],
      redFlags,
      tryTonight: routine,
      whoToSee: "A dermatologist",
      doctorNote,
      sources: ["aadAcneTreat", "aadAcneHabits"],
      suggestTracking: true,
    };
  }

  if (type === "many" || sudden || tried === "short") {
    return {
      verdict: "watch",
      headline: tried === "short" ? "Give it time. Acne treatments are slow." : "Common, and very treatable. Pick one routine.",
      explainer: [
        "Any acne treatment takes at least 6–8 weeks before you see fewer breakouts. Most people switch products after a week and never find out what works.",
        "For pimples, blackheads and whiteheads, the AAD points to three over-the-counter actives: benzoyl peroxide, adapalene and salicylic acid. Apply a thin layer over the whole acne-prone area, not just on the spots.",
        sudden
          ? "A sudden change can follow stress, new skincare or makeup, or a change in medicines. If it came with irregular periods or extra facial hair, mention that to a doctor too."
          : "Use products labelled non-comedogenic (won't clog pores), and never sleep in makeup.",
      ],
      redFlags,
      tryTonight: routine,
      whoToSee: "A dermatologist if it isn't better after 6–8 weeks of one routine",
      doctorNote,
      sources: ["aadAcneTreat", "aadAcneHabits"],
      suggestTracking: true,
    };
  }

  return {
    verdict: "normal",
    headline: "A few spots? That's skin being skin.",
    explainer: [
      "Occasional pimples, blackheads and whiteheads are very common at almost any age, and usually settle on their own.",
      "If you want to help them along, a gentle wash twice a day and one over-the-counter active (benzoyl peroxide, adapalene or salicylic acid) is the textbook routine.",
    ],
    redFlags,
    tryTonight: routine,
    doctorNote,
    sources: ["aadAcneTreat", "aadAcneHabits"],
    suggestTracking: false,
  };
}

const TYPE: Record<string, string> = {
  few: "a few pimples / blackheads now and then",
  many: "lots of pimples, most days",
  deep: "deep, painful lumps under the skin",
};
const TRIED: Record<string, string> = {
  none: "nothing yet",
  short: "products for under 6 weeks",
  long: "the same routine for 6–8+ weeks without improvement",
};
const OTHER: Record<string, string> = {
  scars: "leaving scars or dark marks",
  sudden: "came on suddenly",
  mood: "affecting mood / confidence",
  picking: "picking or popping",
};

function trend(entries: DailyEntry[]): TrendResult {
  const n = (e: DailyEntry) => Number(e.values.spots ?? 0);
  const dots = entries.map((e) => (n(e) === 0 ? "good" : n(e) <= 2 ? "meh" : "bad")) as TrendResult["dots"];
  const series = entries.map((e, i) => ({ label: String(i + 1), value: n(e) }));
  if (entries.length < 7) {
    return {
      verdict: "early",
      headline: `${entries.length} of 14 days logged.`,
      detail: ["Acne moves slowly. One week tells you little, two weeks starts to show a direction, and 6–8 weeks is the real test."],
      dots,
      series,
    };
  }
  const first = avg(entries.slice(0, 7).map(n));
  const last = avg(entries.slice(-7).map(n));
  const picked = entries.filter((e) => e.values.picked === true).length;
  const better = last < first - 0.4;
  return {
    verdict: better ? "normal" : "watch",
    headline: better
      ? `Fewer new spots: ${first.toFixed(1)} → ${last.toFixed(1)} a day.`
      : `About ${last.toFixed(1)} new spots a day, holding steady.`,
    detail: [
      better ? "Heading the right way. Keep the same routine. Consistency is the whole trick." : "Too early to judge a treatment. Stay with one routine for 6–8 weeks before deciding.",
      picked ? `You picked on ${picked} day${picked === 1 ? "" : "s"}. That's the one habit worth breaking first.` : "No picking logged. Nice.",
    ],
    dots,
    series,
  };
}

export const acne: Worry = {
  id: "acne",
  title: "Breakout before the big day",
  whisper: "Why is my skin doing this?",
  forWhom: "Anyone with new or stubborn pimples who's tired of guessing at the chemist",
  blurb: "Find out what works, how long it takes, and when to see a dermatologist.",
  check: "questions",
  questions: [
    {
      id: "type",
      prompt: "What does it look like, mostly?",
      options: [
        { id: "few", label: "A few pimples or blackheads, now and then" },
        { id: "many", label: "Lots of pimples, most days" },
        { id: "deep", label: "Deep, painful lumps under the skin" },
      ],
    },
    {
      id: "tried",
      prompt: "What have you tried so far?",
      help: "Treatments take 6–8 weeks, so how long matters.",
      options: [
        { id: "none", label: "Nothing yet" },
        { id: "short", label: "Some products, for less than 6 weeks" },
        { id: "long", label: "The same routine for 6–8+ weeks, no change" },
      ],
    },
    {
      id: "other",
      prompt: "Anything else?",
      multi: true,
      options: [
        { id: "scars", label: "It's leaving scars or dark marks" },
        { id: "sudden", label: "It came on suddenly" },
        { id: "picking", label: "I pick or pop them" },
        { id: "mood", label: "It's really getting me down" },
        { id: "none", label: "None of these", exclusive: true },
      ],
    },
  ],
  evaluate,
  tracker: {
    kind: "daily",
    days: 14,
    unitLabel: "day",
    prompt: "Count new spots since yesterday. Ten seconds in the mirror.",
    fields: [
      { kind: "number", id: "spots", label: "New spots today", min: 0, max: 50, step: 1, unit: "spots" },
      { kind: "toggle", id: "picked", label: "Picked or popped" },
    ],
    trend,
  },
  example: {
    persona: "Example: 22, final-year student, Hyderabad",
    context: "Breakouts flared during placement season. Stopped switching products and stuck to one benzoyl peroxide wash.",
    entries: exampleSeries([
      { spots: 4, picked: true },
      { spots: 3, picked: true },
      { spots: 5, picked: false },
      { spots: 3, picked: true },
      { spots: 4, picked: false },
      { spots: 2, picked: false },
      { spots: 3, picked: false },
      { spots: 2, picked: false },
      { spots: 2, picked: false },
      { spots: 1, picked: false },
      { spots: 2, picked: false },
      { spots: 1, picked: false },
      { spots: 0, picked: false },
      { spots: 1, picked: false },
    ]),
  },
};
