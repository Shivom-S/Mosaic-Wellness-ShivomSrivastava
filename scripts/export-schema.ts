// Writes server/worries.json: the question/option ids the AI intake is allowed to use.
import { writeFileSync } from "node:fs";
import { WORRIES } from "../src/content";
const schema = WORRIES.map((w) => ({
  id: w.id,
  title: w.title,
  whisper: w.whisper,
  questions: w.questions.map((q) => ({ id: q.id, prompt: q.prompt, multi: !!q.multi, options: q.options.map((o) => ({ id: o.id, label: o.label })) })),
}));
writeFileSync(new URL("../server/worries.json", import.meta.url), JSON.stringify(schema, null, 1));
console.log("wrote server/worries.json");
