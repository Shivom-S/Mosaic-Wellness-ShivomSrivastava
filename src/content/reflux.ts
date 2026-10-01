import type { CheckInput, DailyEntry, Result, TrendResult, Worry } from "./types";
import { exampleSeries, one } from "./util";

// Sources:
// - NIDDK: heartburn = burning behind the breastbone; see a doctor for chest pain,
//   trouble or pain swallowing, vomit with blood or like coffee grounds, black/tarry
//   or bloody stool, unexplained weight loss, persistent vomiting; symptoms that don't
//   go away with OTC medicine; antacids aren't for daily use without a doctor;
//   raise the head of the bed 6–8 inches; lose weight if needed; stop smoking.
// - Mayo Clinic (heartburn): see a doctor if heartburn happens more than twice a
//   week or persists despite OTC medicines; severe chest pain or pressure, especially
//   with arm/jaw pain or breathlessness, can be a heart attack: get emergency help.

function evaluate({ answers }: CheckInput): Result {
  const freq = one(answers, "freq"); // rare | weekly | often
  const otc = one(answers, "otc"); // none | works | daily
  const other = (answers.other ?? []).filter((o) => o !== "none");

  const chest = other.includes("chest");
  const swallow = other.includes("swallow");
  const blood = other.includes("blood");
  const weight = other.includes("weight");
  const vomit = other.includes("vomit");
  const often = freq === "often";
  const dailyOtc = otc === "daily";

  const redFlags = [
    { text: "Crushing chest pain or pressure, pain spreading to the arm or jaw, or breathlessness. Treat it as an emergency", hit: chest },
    { text: "Trouble or pain swallowing", hit: swallow },
    { text: "Vomit with blood or like coffee grounds, or black, tarry stools", hit: blood },
    { text: "Weight loss you can't explain, or vomiting that won't stop", hit: weight || vomit },
    { text: "Heartburn more than twice a week, or needing antacids most days", hit: often || dailyOtc },
  ];

  const doctorNote = [
    `Heartburn: ${FREQ[freq ?? ""] ?? "not sure"}.`,
    `Antacids / OTC: ${OTC[otc ?? ""] ?? "not sure"}.`,
    other.length ? `Also: ${other.map((o) => OTHER[o]).join("; ")}.` : "No swallowing trouble, bleeding signs, weight loss or chest pressure.",
  ];

  const tonight =
    "Prop your head and upper back up 6–8 inches (a wedge or extra pillows under the shoulders, not just the head), and skip the late snack. Lying flat on a full stomach makes reflux worse.";

  if (chest) {
    return {
      verdict: "doctor",
      headline: "Chest pressure isn't a ‘wait and see’. Get checked now.",
      explainer: [
        "Heartburn and heart trouble can feel alike. Crushing pain or pressure, especially spreading to the arm or jaw, or with breathlessness or sweating, needs emergency care. Don't wait to find out which it is.",
      ],
      redFlags,
      tryTonight: "Call 112 or get to the nearest emergency department now. Don't drive yourself.",
      whoToSee: "Emergency care",
      urgency: "Now, not in the morning.",
      doctorNote,
      sources: ["mayoHeartburn", "niddkGerdSymptoms"],
      suggestTracking: false,
    };
  }

  if (swallow || blood || weight || vomit) {
    return {
      verdict: "doctor",
      headline: "Those signs need a doctor, not antacids.",
      explainer: [
        "Heartburn on its own is very common. Trouble swallowing, signs of bleeding, unexplained weight loss or vomiting that won't stop are on the NIDDK's list of reasons to see a doctor.",
        "That doesn't mean something serious, just that someone needs to look.",
      ],
      redFlags,
      tryTonight: tonight,
      whoToSee: "A doctor (often a gastroenterologist)",
      urgency: blood ? "Soon. Today if you're vomiting blood or feel faint." : undefined,
      doctorNote,
      sources: ["niddkGerdSymptoms", "mayoHeartburn"],
      suggestTracking: false,
    };
  }

  if (often || dailyOtc) {
    return {
      verdict: "doctor",
      headline: "More than twice a week is worth a proper look.",
      explainer: [
        "Occasional heartburn is normal. Heartburn more than twice a week, or needing antacids most days, is when doctors want to see you, because it can be GERD (ongoing acid reflux) and it's very treatable.",
        "Antacids are fine for occasional use, but they're not meant to be a daily habit without a doctor's advice.",
      ],
      redFlags,
      tryTonight: tonight,
      whoToSee: "A doctor (GP / physician)",
      doctorNote,
      sources: ["mayoHeartburn", "niddkGerdTreat"],
      suggestTracking: true,
    };
  }

  return {
    verdict: freq === "weekly" ? "watch" : "normal",
    headline: freq === "weekly" ? "Occasional heartburn. Worth tweaking your evenings." : "A bit of heartburn after a heavy meal is normal.",
    explainer: [
      "That burning behind the breastbone is acid coming back up. Big, late, spicy or fried dinners, lying down soon after eating, and smoking all make it more likely.",
      "If it creeps up to more than twice a week, that's the point to see a doctor.",
    ],
    redFlags,
    tryTonight: tonight,
    whoToSee: freq === "weekly" ? "A doctor if it's more than twice a week" : undefined,
    doctorNote,
    sources: ["niddkGerdTreat", "mayoHeartburn"],
    suggestTracking: freq === "weekly",
  };
}

const FREQ: Record<string, string> = { rare: "now and then, after heavy meals", weekly: "about once or twice a week", often: "more than twice a week" };
const OTC: Record<string, string> = { none: "not used", works: "occasionally, they work", daily: "needed most days" };
const OTHER: Record<string, string> = {
  chest: "chest pressure / pain spreading to arm or jaw / breathless",
  swallow: "trouble or pain swallowing",
  blood: "blood in vomit or black stools",
  weight: "unexplained weight loss",
  vomit: "persistent vomiting",
  late: "late, heavy dinners",
};

function trend(entries: DailyEntry[]): TrendResult {
  const s = (e: DailyEntry) => String(e.values.burn ?? "none");
  const dots = entries.map((e) => (s(e) === "none" ? "good" : s(e) === "mild" ? "meh" : "bad")) as TrendResult["dots"];
  const series = entries.map((e, i) => ({ label: String(i + 1), value: s(e) === "none" ? 0 : s(e) === "mild" ? 1 : 2 }));
  if (entries.length < 7) {
    return { verdict: "early", headline: `${entries.length} of 14 nights logged.`, detail: ["Doctors think in times per week, so give it a full week."], dots, series };
  }
  const last = entries.slice(-7);
  const nights = last.filter((e) => s(e) !== "none").length;
  const lateBad = last.filter((e) => e.values.late === true && s(e) !== "none").length;
  return {
    verdict: nights > 2 ? "doctor" : nights > 0 ? "watch" : "normal",
    headline: `Heartburn on ${nights} of the last 7 nights.`,
    detail: [
      nights > 2 ? "That's more than twice a week, the point where a doctor is worth seeing." : "Under twice a week. Keep an eye on it.",
      lateBad ? `${lateBad} of those followed a late dinner. That's your easiest lever.` : "No clear link to late dinners this week.",
    ],
    dots,
    series,
  };
}

export const reflux: Worry = {
  id: "reflux",
  title: "Burning after dinner",
  whisper: "Why does my chest burn when I lie down?",
  forWhom: "Anyone with acidity or heartburn that shows up at bedtime",
  blurb: "When it's just dinner, when it's GERD, and the signs that can't wait.",
  check: "questions",
  questions: [
    {
      id: "freq",
      prompt: "How often do you get that burning feeling?",
      options: [
        { id: "rare", label: "Now and then, after a heavy meal" },
        { id: "weekly", label: "About once or twice a week" },
        { id: "often", label: "More than twice a week" },
      ],
    },
    {
      id: "otc",
      prompt: "Antacids (Digene, Eno, Gelusil…)?",
      options: [
        { id: "none", label: "Haven't needed them" },
        { id: "works", label: "Sometimes, and they work" },
        { id: "daily", label: "I need them most days" },
      ],
    },
    {
      id: "other",
      prompt: "Any of these?",
      multi: true,
      options: [
        { id: "late", label: "Late, heavy dinners" },
        { id: "swallow", label: "Trouble or pain swallowing" },
        { id: "blood", label: "Blood in vomit, or black stools" },
        { id: "weight", label: "Losing weight without trying" },
        { id: "vomit", label: "Vomiting that won't stop" },
        { id: "chest", label: "Crushing chest pressure, or pain to arm/jaw, or breathless" },
        { id: "none", label: "None of these", exclusive: true },
      ],
    },
  ],
  evaluate,
  tracker: {
    kind: "daily",
    days: 14,
    unitLabel: "night",
    prompt: "Ten seconds, before bed or next morning.",
    fields: [
      {
        kind: "chips",
        id: "burn",
        label: "Heartburn tonight?",
        options: [
          { id: "none", label: "None", score: 0 },
          { id: "mild", label: "Mild", score: 1 },
          { id: "bad", label: "Bad", score: 2 },
        ],
      },
      { kind: "toggle", id: "late", label: "Ate within 3 hours of bed" },
    ],
    trend,
  },
  example: {
    persona: "Example: 34, consultant, Gurugram",
    context: "Burning most nights after 11 PM dinners. Moved dinner to 8:30 and raised the head of the bed.",
    entries: exampleSeries([
      { burn: "bad", late: true },
      { burn: "mild", late: true },
      { burn: "bad", late: true },
      { burn: "none", late: false },
      { burn: "mild", late: true },
      { burn: "bad", late: true },
      { burn: "mild", late: false },
      { burn: "none", late: false },
      { burn: "none", late: false },
      { burn: "mild", late: true },
      { burn: "none", late: false },
      { burn: "none", late: false },
      { burn: "none", late: false },
      { burn: "none", late: false },
    ]),
  },
};
