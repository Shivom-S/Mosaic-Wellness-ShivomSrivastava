import { cycle } from "./cycle";
import { hair } from "./hair";
import { sleep } from "./sleep";
import { toddler } from "./toddler";
import type { Worry, WorryId } from "./types";

export const WORRIES: Worry[] = [hair, cycle, sleep, toddler];
export const WORRY: Record<WorryId, Worry> = { hair, cycle, sleep, toddler };

export const VERDICT_COPY = {
  normal: { label: "Normal", short: "You're fine", tone: "calm" },
  watch: { label: "Keep an eye on it", short: "Watch it", tone: "amber" },
  doctor: { label: "Worth a doctor visit", short: "See a doctor", tone: "coral" },
} as const;

// "Say it your way": deterministic keyword matching, English + Hinglish.
// No AI needed; it either finds one of our four worries or says so honestly.
const KEYWORDS: Record<WorryId, string[]> = {
  hair: [
    "hair", "hairfall", "hair fall", "bald", "balding", "shedding", "receding", "hairline",
    "comb", "pillow", "drain", "scalp", "thinning", "baal", "bal gir", "baal gir", "jhad",
    "jhadna", "jhad rahe", "takla", "ganja", "gir rahe", "girte", "dandruff", "patch",
  ],
  cycle: [
    "period", "periods", "cycle", "menstru", "late period", "missed period", "pcos", "pcod",
    "bleeding", "spotting", "mc", "chums", "date nahi", "date late", "mahina", "mahine",
    "masik", "irregular", "cramps", "pad",
  ],
  sleep: [
    "sleep", "insomnia", "awake", "wake up", "waking", "3am", "3 am", "4am", "night", "neend",
    "nind", "neend nahi", "so nahi", "sone", "jaag", "jag jata", "jaagti", "raat", "tired",
    "restless", "snore", "snoring",
  ],
  toddler: [
    "toddler", "baby", "kid", "child", "son", "daughter", "picky", "fussy", "won't eat",
    "wont eat", "not eating", "doesn't eat", "baccha", "bachcha", "bacha", "beta", "beti",
    "khana nahi", "khaata nahi", "khata nahi", "khati nahi", "khaana", "doodh", "milk",
  ],
};

export function matchWorry(text: string): WorryId | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ")} `;
  let best: WorryId | null = null;
  let bestScore = 0;
  (Object.keys(KEYWORDS) as WorryId[]).forEach((id) => {
    const score = KEYWORDS[id].reduce((s, k) => (t.includes(k.length <= 3 ? ` ${k} ` : k) ? s + k.length : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  });
  return best;
}

export * from "./types";
export { SOURCES, sourceList } from "./sources";
