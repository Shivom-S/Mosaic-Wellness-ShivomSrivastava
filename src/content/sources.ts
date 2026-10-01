import type { Source } from "./types";

// Every number 1AM shows comes from one of these. If it isn't here, we don't say it.
export const SOURCES: Record<string, Source> = {
  aadShedding: {
    id: "aadShedding",
    org: "American Academy of Dermatology",
    title: "Do you have hair loss or hair shedding?",
    url: "https://www.aad.org/public/diseases/hair-loss/insider/shedding",
  },
  aadHairLossTypes: {
    id: "aadHairLossTypes",
    org: "American Academy of Dermatology",
    title: "Hair loss: Diagnosis and treatment",
    url: "https://www.aad.org/public/diseases/hair-loss/treatment/diagnosis-treat",
  },
  ccIrregular: {
    id: "ccIrregular",
    org: "Cleveland Clinic",
    title: "Irregular periods (abnormal menstruation)",
    url: "https://my.clevelandclinic.org/health/diseases/14633-abnormal-menstruation-periods",
  },
  acogTeens: {
    id: "acogTeens",
    org: "ACOG",
    title: "Menstruation in girls and adolescents: using the menstrual cycle as a vital sign",
    url: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign",
  },
  owhCycle: {
    id: "owhCycle",
    org: "US Office on Women's Health",
    title: "Your menstrual cycle",
    url: "https://www.womenshealth.gov/menstrual-cycle/your-menstrual-cycle",
  },
  nsfInsomnia: {
    id: "nsfInsomnia",
    org: "National Sleep Foundation",
    title: "Do I have insomnia?",
    url: "https://www.thensf.org/do-i-have-insomnia/",
  },
  osuWaking: {
    id: "osuWaking",
    org: "Ohio State University Wexner Medical Center",
    title: "Why do I wake up at the same time every night?",
    url: "https://health.osu.edu/health/sleep/why-do-i-wake-up-at-the-same-time-every-night",
  },
  aasmInsomnia: {
    id: "aasmInsomnia",
    org: "American Academy of Sleep Medicine",
    title: "Insomnia — overview and treatment (sleepeducation.org)",
    url: "https://sleepeducation.org/sleep-disorders/insomnia/",
  },
  stanfordStimulus: {
    id: "stanfordStimulus",
    org: "Stanford Sleep Health & Insomnia Program",
    title: "Stimulus control procedures (CBT-I handout)",
    url: "https://med.stanford.edu/content/dam/sm/insomnia/documents/cbtigroup/Stimulus-Control-Procedures.pdf",
  },
  aapMilk: {
    id: "aapMilk",
    org: "American Academy of Pediatrics (HealthyChildren.org)",
    title: "Your toddler only wants milk? How to ease a milk dependency",
    url: "https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/your-toddler-only-wants-milk-how-to-ease-milk-dependency-and-encourage-a-healthy-diet.aspx",
  },
  aapPicky: {
    id: "aapPicky",
    org: "American Academy of Pediatrics (HealthyChildren.org)",
    title: "10 tips for parents of picky eaters",
    url: "https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Picky-Eaters.aspx",
  },
  seattlePicky: {
    id: "seattlePicky",
    org: "Seattle Children's",
    title: "Picky eaters",
    url: "https://www.seattlechildrens.org/health-safety/nutrition-wellness/picky-eaters/",
  },
  chopPicky: {
    id: "chopPicky",
    org: "Children's Hospital of Philadelphia",
    title: "Feeding a picky eater: the do's and don'ts",
    url: "https://www.chop.edu/news/dos-and-donts-feeding-picky-eaters",
  },
};

export const sourceList = (ids: string[]) =>
  Array.from(new Set(ids))
    .map((id) => SOURCES[id])
    .filter(Boolean);
