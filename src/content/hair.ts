import type { CheckInput, DailyEntry, Result, TrendResult, Worry } from "./types";
import { avg, exampleSeries, one } from "./util";

// Thresholds (AAD): shedding 50–100 hairs/day is normal. Excessive shedding
// (telogen effluvium) usually shows up a few months after a trigger (fever,
// childbirth, big weight loss, surgery, severe stress, stopping the pill) and
// hair tends to regain normal fullness within 6–9 months once the trigger passes.
export const NORMAL_MAX = 100;

const TRIGGER_LABELS: Record<string, string> = {
  fever: "a high fever or bad infection (dengue, typhoid, COVID…)",
  weight: "a crash diet or big weight loss",
  surgery: "surgery or a hospital stay",
  baby: "having a baby",
  stress: "a really stressful stretch",
  pill: "stopping birth-control pills",
};

export const totalCount = (c?: CheckInput["count"]) =>
  c ? c.pillow + c.comb + c.drain + c.elsewhere : 0;

function evaluate({ answers, count }: CheckInput): Result {
  const n = totalCount(count);
  const washDay = one(answers, "wash") === "yes";
  const duration = one(answers, "duration"); // short | months | long | verylong
  const where = one(answers, "where"); // diffuse | pattern | patches
  const triggers = (answers.trigger ?? []).filter((t) => t !== "none");
  const scalp = (answers.scalp ?? []).filter((s) => s !== "none");

  const patches = where === "patches";
  const pattern = where === "pattern";
  const scalpPain = scalp.includes("pain") || scalp.includes("red");
  const high = n > NORMAL_MAX;
  const veryLong = duration === "verylong";

  const redFlags = [
    { text: "Round or patchy bald spots", hit: patches },
    { text: "Scalp pain, burning, redness or sores", hit: scalpPain },
    { text: "Hairline moving back, or the crown / your parting looking wider", hit: pattern },
    { text: "Heavy shedding that hasn't eased after about 6 months", hit: high && veryLong },
  ];

  const doctorNote = [
    `Hairs counted in one day: ${n}${count ? ` (pillow ${count.pillow}, comb/brush ${count.comb}, drain ${count.drain}, elsewhere ${count.elsewhere})` : ""}${washDay ? " — on a hair-wash day" : ""}.`,
    `Going on for: ${durationText(duration)}.`,
    `Where it's coming from: ${where === "patches" ? "patchy spots" : where === "pattern" ? "thinning at hairline / crown / parting" : "all over the head"}.`,
    triggers.length
      ? `In the 2–4 months before it started: ${triggers.map((t) => TRIGGER_LABELS[t]).join("; ")}.`
      : "No obvious trigger in the months before it started.",
    scalp.length ? `Scalp: ${scalp.map((s) => SCALP[s]).join(", ")}.` : "Scalp: no itching, pain or redness.",
  ];

  const sources = ["aadShedding"];

  // 1) Things a dermatologist should see regardless of count.
  if (patches || scalpPain) {
    return {
      verdict: "doctor",
      headline: patches ? "Patches are worth showing a dermatologist." : "Your scalp is asking for a dermatologist.",
      explainer: [
        patches
          ? "Shedding is spread out. Round, patchy spots are a different thing and usually have a specific cause that a dermatologist can identify."
          : "Hair fall with pain, burning or redness usually means something is going on in the scalp itself. That's diagnosable and usually treatable.",
        "This isn't an emergency. It is the kind of thing that responds better the earlier someone looks at it.",
      ],
      redFlags,
      tryTonight: "Take a clear photo of the area in daylight today, and another in two weeks. It's the most useful thing you can bring to the appointment.",
      whoToSee: "A dermatologist",
      doctorNote,
      sources: [...sources, "aadHairLossTypes"],
      suggestTracking: false,
    };
  }

  if (pattern) {
    return {
      verdict: "doctor",
      headline: "Not urgent, but worth a dermatologist visit.",
      explainer: [
        "Daily shedding and gradual thinning in one area are two different things. A receding hairline, a thinning crown or a widening parting usually point to hereditary hair loss rather than shedding.",
        `Your count today was ${n}. ${high ? "That's above the usual 50–100 range." : "That's within the usual 50–100 range."} With this kind of thinning, the count matters less than the pattern.`,
        "The AAD's advice is plain: with hereditary hair loss, the earlier you start treatment, the more likely you are to see regrowth.",
      ],
      redFlags,
      tryTonight: "Take two photos in the same light, top of the head and hairline, so you have a baseline. Memory is a terrible way to measure hair.",
      whoToSee: "A dermatologist",
      doctorNote,
      sources: [...sources, "aadHairLossTypes"],
      suggestTracking: true,
    };
  }

  // 2) Count-led verdicts for diffuse shedding.
  if (!high) {
    return {
      verdict: "normal",
      headline: n === 0 ? "Zero hairs? Lucky you." : `${n} hairs is normal.`,
      explainer: [
        "Dermatologists consider shedding 50–100 hairs a day normal. You're inside that range.",
        washDay
          ? "Wash days look scarier because hair that had already let go comes out all at once. Today's count includes all of that and still came in under 100."
          : "Hairs grow, rest and fall out on a cycle, and new ones grow in behind them. Seeing hair in the drain is part of that cycle, not a warning sign.",
        "One count is one day. If it keeps bothering you, count again on a few more days and you'll get an answer you can trust.",
      ],
      redFlags,
      tryTonight: "Close the search tab. Nothing you've told us needs treatment. If you want proof over time, track it for 14 days.",
      doctorNote,
      sources,
      suggestTracking: false,
    };
  }

  // High count.
  if (veryLong) {
    return {
      verdict: "doctor",
      headline: "Six months is long enough. Get it looked at.",
      explainer: [
        `${n} hairs is above the 50–100 a day dermatologists consider normal, and you've been seeing this for more than six months.`,
        "Shedding after a one-off trigger usually settles within 6–9 months. Shedding that keeps going often has an ongoing cause that a dermatologist can help find.",
      ],
      redFlags,
      tryTonight: "Note down anything that changed in the months before it started: diet, medicines, illness, stress. That timeline is what a dermatologist will ask you for.",
      whoToSee: "A dermatologist",
      doctorNote,
      sources,
      suggestTracking: true,
    };
  }

  if (triggers.length) {
    const t = TRIGGER_LABELS[triggers[0]];
    return {
      verdict: "watch",
      headline: "This looks like shedding after a shock. It usually passes.",
      explainer: [
        `${n} hairs is above the usual 50–100. It also matches a well-known pattern: heavy shedding that starts a few months after ${t}.`,
        "Dermatologists call this telogen effluvium. The trigger pushes lots of hairs into their resting phase at once, and they fall out together a few months later.",
        "The AAD says hair tends to regain its normal fullness within 6–9 months once the trigger has passed. Ongoing stress can keep it going.",
      ],
      redFlags,
      tryTonight: "Don't switch shampoo, oil or routine every week. Change nothing for 14 days and track the count instead.",
      whoToSee: "A dermatologist if it's not easing by 6 months, or sooner if any red flag shows up",
      doctorNote,
      sources,
      suggestTracking: true,
    };
  }

  return {
    verdict: "watch",
    headline: washDay ? "A high wash-day count. Don't panic yet." : "A bit above normal. Keep an eye on it.",
    explainer: [
      `${n} hairs is above the 50–100 a day dermatologists consider normal.`,
      washDay
        ? "Wash days collect hair from the days you didn't wash, so a single wash-day count runs high. What matters is your average over a couple of weeks."
        : "A single day can run high. What matters is whether it stays high for weeks.",
      "If you can't think of a trigger and it stays above 100 for weeks, that's when a dermatologist is worth it.",
    ],
    redFlags,
    tryTonight: "Track for 14 days, counting at the same places each time. You'll have a real trend instead of a 1 AM guess.",
    whoToSee: "A dermatologist if the 14-day average stays above 100",
    doctorNote,
    sources,
    suggestTracking: true,
  };
}

const SCALP: Record<string, string> = {
  itch: "itching or flaking",
  pain: "pain or burning",
  red: "redness or sores",
};

function durationText(d?: string) {
  switch (d) {
    case "short":
      return "less than 2 weeks";
    case "months":
      return "2 weeks to 3 months";
    case "long":
      return "3 to 6 months";
    case "verylong":
      return "more than 6 months";
    default:
      return "not sure";
  }
}

function trend(entries: DailyEntry[]): TrendResult {
  const counts = entries.map((e) => Number(e.values.count ?? 0));
  const dots = entries.map((e) => {
    const c = Number(e.values.count ?? 0);
    return c <= NORMAL_MAX ? "good" : c <= 150 ? "meh" : "bad";
  }) as TrendResult["dots"];
  const series = counts.map((value, i) => ({ label: String(i + 1), value }));
  const reference = { value: NORMAL_MAX, label: "100 / day" };

  if (entries.length < 5) {
    return {
      verdict: "early",
      headline: `${entries.length} of 14 days logged.`,
      detail: [
        "Single days swing a lot, especially wash days. Give it at least 5 days before reading anything into it.",
      ],
      dots,
      series,
      reference,
    };
  }

  const recent = counts.slice(-7);
  const first = counts.slice(0, Math.max(0, counts.length - 7)).slice(-7);
  const recentAvg = Math.round(avg(recent));
  const firstAvg = first.length ? Math.round(avg(first)) : null;
  const falling = firstAvg !== null && recentAvg < firstAvg - 10;
  const rising = firstAvg !== null && recentAvg > firstAvg + 10;

  if (recentAvg <= NORMAL_MAX) {
    return {
      verdict: "normal",
      headline: falling ? `Coming back down: about ${recentAvg} a day.` : `About ${recentAvg} a day. That's normal.`,
      detail: [
        "Your recent 7-day average is inside the 50–100 range dermatologists call normal.",
        falling && firstAvg ? `That's down from about ${firstAvg} a day earlier on.` : "The single bad days average out.",
      ],
      dots,
      series,
      reference,
    };
  }

  if (falling && firstAvg) {
    return {
      verdict: "watch",
      headline: `Coming down: ${firstAvg} → ${recentAvg} a day.`,
      detail: [
        "Still a little above the 50–100 range, but heading the right way. That's typical of shedding that's winding down after a trigger.",
        "Keep counting a couple of days a week. If it climbs again, or it's still above 100 at the 6-month mark, see a dermatologist.",
      ],
      dots,
      series,
      reference,
    };
  }

  return {
    verdict: rising || recentAvg > 150 ? "doctor" : "watch",
    headline: rising
      ? `Rising: about ${recentAvg} a day.`
      : `Still about ${recentAvg} a day.`,
    detail: [
      `Your recent 7-day average is above 100.${firstAvg ? ` Earlier it was about ${firstAvg}.` : ""}`,
      rising || recentAvg > 150
        ? "Steady or rising shedding at this level is worth a dermatologist visit. Take this chart with you."
        : "If you had a trigger 2–4 months ago, this can take months to settle. If there was no trigger, or it's past 6 months, see a dermatologist.",
    ],
    dots,
    series,
    reference,
  };
}

export const hair: Worry = {
  id: "hair",
  title: "Hair in the drain",
  whisper: "Am I going bald?",
  forWhom: "Anyone seeing more hair on the pillow, comb or bathroom floor",
  blurb: "Count it, then read it against what dermatologists consider normal.",
  check: "count",
  questions: [
    {
      id: "wash",
      prompt: "Did you wash your hair today?",
      help: "Wash days always look worse.",
      options: [
        { id: "yes", label: "Yes, it was wash day" },
        { id: "no", label: "No" },
      ],
    },
    {
      id: "duration",
      prompt: "How long has it felt like this?",
      options: [
        { id: "short", label: "Less than 2 weeks" },
        { id: "months", label: "2 weeks – 3 months" },
        { id: "long", label: "3 – 6 months" },
        { id: "verylong", label: "More than 6 months" },
      ],
    },
    {
      id: "where",
      prompt: "Where does it seem to be coming from?",
      options: [
        { id: "diffuse", label: "All over, everywhere" },
        { id: "pattern", label: "Thinning at the hairline, crown or parting" },
        { id: "patches", label: "Round or patchy bald spots" },
      ],
    },
    {
      id: "trigger",
      prompt: "Anything big happen 2–4 months before it started?",
      help: "Shedding usually lags its cause by a few months.",
      multi: true,
      options: [
        { id: "fever", label: "High fever / bad infection", hint: "dengue, typhoid, COVID" },
        { id: "weight", label: "Crash diet or big weight loss" },
        { id: "surgery", label: "Surgery or hospital stay" },
        { id: "baby", label: "Had a baby" },
        { id: "stress", label: "Very stressful stretch", hint: "exams, job, breakup" },
        { id: "pill", label: "Stopped birth-control pills" },
        { id: "none", label: "Nothing I can think of", exclusive: true },
      ],
    },
    {
      id: "scalp",
      prompt: "Anything going on with your scalp?",
      multi: true,
      options: [
        { id: "itch", label: "Itching or flaking" },
        { id: "pain", label: "Pain or burning" },
        { id: "red", label: "Redness or sores" },
        { id: "none", label: "Nope, scalp's fine", exclusive: true },
      ],
    },
  ],
  evaluate,
  tracker: {
    kind: "daily",
    days: 14,
    unitLabel: "day",
    prompt: "Count today's hairs from the same places you counted before.",
    fields: [
      { kind: "number", id: "count", label: "Hairs today", min: 0, max: 600, step: 1, unit: "hairs" },
      { kind: "toggle", id: "wash", label: "Wash day" },
    ],
    trend,
  },
  example: {
    persona: "Example: 24, software engineer, Pune",
    context: "Hair started coming out in handfuls about 10 weeks after a bad bout of dengue. Counted every evening for 14 days.",
    entries: exampleSeries([
      { count: 168, wash: false },
      { count: 152, wash: false },
      { count: 196, wash: true },
      { count: 141, wash: false },
      { count: 137, wash: false },
      { count: 171, wash: true },
      { count: 128, wash: false },
      { count: 119, wash: false },
      { count: 106, wash: false },
      { count: 134, wash: true },
      { count: 101, wash: false },
      { count: 94, wash: false },
      { count: 88, wash: false },
      { count: 97, wash: false },
    ]),
  },
};
