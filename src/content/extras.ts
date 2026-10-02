import type { WorryId } from "./types";

// "Tonight, don't" — behavioural, non-clinical guardrails per worry.
export const DONTS: Record<WorryId, string[]> = {
  hair: [
    "Don't buy a new oil, serum or supplement tonight. Changing things every week makes it impossible to tell what's working.",
    "Don't image-search 'alopecia' at 1 AM. Worst-case photos aren't your scalp.",
    "Don't stop washing your hair to 'save' it. The hairs that come out on wash day had already let go.",
  ],
  cycle: [
    "Don't take anyone else's hormonal pills or 'period-inducing' remedies.",
    "Don't diagnose yourself with PCOS from a forum thread. It needs a doctor and usually a test or two.",
    "Don't panic over one late cycle. Stress, travel and illness all shift it.",
  ],
  sleep: [
    "Don't check the time. It starts the 'only 4 hours left' maths.",
    "Don't take sleeping pills that weren't prescribed for you.",
    "Don't lie there for an hour 'trying'. Get up after about 20 minutes.",
  ],
  acne: [
    "Don't pop or squeeze. It pushes bacteria deeper and makes scars more likely.",
    "Don't switch products every week. Anything needs 6–8 weeks to show results.",
    "Don't scrub, or wash more than twice a day. Irritated skin breaks out more.",
  ],
  dandruff: [
    "Don't rinse the dandruff shampoo straight off. It needs about 5 minutes on the scalp.",
    "Don't pile on more oil to 'cure' it. Flakes aren't dryness you can oil away.",
    "Don't scratch with your nails. A broken scalp gets sore and irritated.",
  ],
  reflux: [
    "Don't lie flat right after eating. Give it 2–3 hours.",
    "Don't take antacids every single day without talking to a doctor.",
    "Don't brush off crushing chest pressure as 'just acidity'. That's an emergency check.",
  ],
  toddler: [
    "Don't force, bribe or chase with the spoon. Pressure makes refusal stronger.",
    "Don't replace the skipped meal with extra milk or biscuits.",
    "Don't judge the day by one meal. Toddlers balance out over a week.",
  ],
};

// Home's example question cells (UI only). Each one opens that worry's check directly.
export const QUICK_QUESTIONS: { label: string; worry: WorryId }[] = [
  { label: "Losing more hair than usual", worry: "hair" },
  { label: "My period is late or irregular", worry: "cycle" },
  { label: "Can't sleep through the night", worry: "sleep" },
  { label: "My child won't eat", worry: "toddler" },
  { label: "Sudden breakouts", worry: "acne" },
  { label: "Itchy, flaky scalp", worry: "dandruff" },
  { label: "Acidity after meals", worry: "reflux" },
];

// Urgent-help sheet. Deliberately short and non-diagnostic.
// India: 112 is the national emergency number; 108 is the emergency ambulance
// service in most states; Tele-MANAS (14416) is the government mental-health line.
export const URGENT = {
  title: "Don't wait on an app",
  intro:
    "If any of these are happening now, get medical help straight away: call emergency services or go to the nearest emergency department.",
  signs: [
    "Chest pain or pressure, especially spreading to the arm, jaw or back",
    "Trouble breathing, or lips turning blue",
    "Fainting, a seizure, or being very hard to wake",
    "Sudden weakness or numbness on one side, a drooping face, or slurred speech",
    "Heavy bleeding that won't stop",
    "A child who is floppy, very drowsy, or not drinking and has very few wet nappies",
    "Thoughts of harming yourself",
  ],
  numbers: [
    { label: "Emergency (India)", number: "112" },
    { label: "Ambulance", number: "108" },
    { label: "Tele-MANAS mental health line, 24×7", number: "14416" },
  ],
  footer: "Outside India, call your local emergency number.",
};

// Source ids shown in the Check screen's "About this check" panel (all exist in sources.ts).
export const WORRY_SOURCES: Record<WorryId, string[]> = {
  hair: ["aadShedding", "aadHairLossTypes"],
  cycle: ["ccIrregular", "acogTeens"],
  sleep: ["osuWaking", "nsfInsomnia", "aasmInsomnia", "stanfordStimulus"],
  toddler: ["aapPicky", "chopPicky", "aapMilk", "seattlePicky"],
  acne: ["aadAcneTreat", "aadAcneHabits"],
  dandruff: ["aadDandruff"],
  reflux: ["niddkGerdSymptoms", "niddkGerdTreat", "mayoHeartburn"],
};
