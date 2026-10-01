import { WORRIES, WORRY, matchWorry, SOURCES } from "../src/content";
let fail = 0;
const expect = (name: string, got: unknown, want: unknown) => {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? "✓" : "✗"} ${name}: ${String(got)}${ok ? "" : ` (want ${String(want)})`}`);
};
const c = (p: number, co: number, d: number, e = 0) => ({ pillow: p, comb: co, drain: d, elsewhere: e });
const H = WORRY.hair.evaluate;
expect("hair normal", H({ answers: { wash: ["no"], duration: ["months"], where: ["diffuse"], trigger: ["none"], scalp: ["none"] }, count: c(10, 30, 40) }).verdict, "normal");
expect("hair TE", H({ answers: { wash: ["no"], duration: ["months"], where: ["diffuse"], trigger: ["fever"], scalp: ["none"] }, count: c(20, 60, 80) }).verdict, "watch");
expect("hair patches", H({ answers: { wash: ["no"], duration: ["months"], where: ["patches"], trigger: ["none"], scalp: ["none"] }, count: c(5, 5, 5) }).verdict, "doctor");
expect("hair pattern", H({ answers: { wash: ["no"], duration: ["long"], where: ["pattern"], trigger: ["none"], scalp: ["none"] }, count: c(5, 30, 30) }).verdict, "doctor");
expect("hair verylong high", H({ answers: { wash: ["no"], duration: ["verylong"], where: ["diffuse"], trigger: ["stress"], scalp: ["none"] }, count: c(30, 60, 80) }).verdict, "doctor");
const C = WORRY.cycle.evaluate;
expect("cycle normal", C({ answers: { stage: ["adult"], gap: ["21to35"], vary: ["steady"], other: ["none"] } }).verdict, "normal");
expect("cycle teen 40", C({ answers: { stage: ["early"], gap: ["36to45"], vary: ["steady"], other: ["none"] } }).verdict, "normal");
expect("cycle adult 40", C({ answers: { stage: ["adult"], gap: ["36to45"], vary: ["steady"], other: ["none"] } }).verdict, "watch");
expect("cycle pcos", C({ answers: { stage: ["adult"], gap: ["gt45"], vary: ["varies"], other: ["androgen"] } }).verdict, "doctor");
expect("cycle soaking", C({ answers: { stage: ["adult"], gap: ["21to35"], vary: ["steady"], other: ["soaking"] } }).urgency !== undefined, true);
const S = WORRY.sleep.evaluate;
expect("sleep normal", S({ answers: { freq: ["rare"], dur: ["lt1"], awake: ["quick"], day: ["fine"], other: ["none"] } }).verdict, "normal");
expect("sleep watch", S({ answers: { freq: ["some"], dur: ["1to3"], awake: ["mid"], day: ["tired"], other: ["phone"] } }).verdict, "watch");
expect("sleep chronic", S({ answers: { freq: ["most"], dur: ["gt3"], awake: ["long"], day: ["tired"], other: ["racing"] } }).verdict, "doctor");
expect("sleep apnea", S({ answers: { freq: ["some"], dur: ["gt3"], awake: ["quick"], day: ["impact"], other: ["snore"] } }).headline.includes("apnoea"), true);
const T = WORRY.toddler.evaluate;
expect("toddler normal", T({ answers: { age: ["2to3"], pattern: ["few"], growth: ["ok"], other: ["none"] } }).verdict, "normal");
expect("toddler milk", T({ answers: { age: ["1to2"], pattern: ["milk"], growth: ["ok"], other: ["none"] } }).verdict, "watch");
expect("toddler flagged", T({ answers: { age: ["1to2"], pattern: ["refuses"], growth: ["flagged"], other: ["none"] } }).verdict, "doctor");
for (const w of WORRIES) {
  const t = w.tracker.trend(w.example.entries);
  console.log(`  example ${w.id}: [${t.verdict}] ${t.headline} | dots=${t.dots.join(",")}`);
  const r = w.evaluate({ answers: {}, count: c(0, 0, 0) });
  for (const s of r.sources) if (!SOURCES[s]) { fail++; console.log("✗ missing source", s); }
}
expect("match hinglish hair", matchWorry("baal bahut gir rahe hain"), "hair");
expect("match period", matchWorry("periods late by 10 days"), "cycle");
expect("match neend", matchWorry("raat ko neend nahi aati"), "sleep");
expect("match toddler", matchWorry("my 2 year old won't eat anything"), "toddler");
expect("match none", matchWorry("my knee hurts"), null);
console.log(fail ? `\n${fail} FAILED` : "\nall good");
process.exit(fail ? 1 : 0);
