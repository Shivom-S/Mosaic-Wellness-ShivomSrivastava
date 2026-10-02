import { useState } from "react";
import { toast } from "sonner";
import { Meh, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import type { Verdict, WorryId } from "@/content";
import { apiEnabled, sendRating } from "@/lib/api";
import { keys, store } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Answer = "yes" | "sort-of" | "no";
type Tone = "cautious" | "vague" | "right";

interface Saved {
  answer: Answer;
  tone?: Tone;
  at: number;
}

const ANSWERS: { id: Answer; label: string; icon: LucideIcon }[] = [
  { id: "yes", label: "Yes", icon: ThumbsUp },
  { id: "sort-of", label: "Sort of", icon: Meh },
  { id: "no", label: "Not really", icon: ThumbsDown },
];
const TONES: { id: Tone; label: string }[] = [
  { id: "cautious", label: "Too cautious" },
  { id: "vague", label: "Too vague" },
  { id: "right", label: "Just right" },
];

const chip = (on: boolean) =>
  cn(
    "inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-full border px-4 text-small font-medium transition duration-75 active:scale-[0.97]",
    on ? "border-lamp bg-lamp/15 text-ink" : "border-line bg-surface text-ink hover:border-lamp/60 hover:bg-surface-2",
  );

/** "Did this answer what you needed?" as one compact row. Saved to this phone only unless the API is on. */
export function Feedback({ worryId, verdict }: { worryId: WorryId | "ai"; verdict: Verdict }) {
  const [saved, setSaved] = useState<Saved | null>(() => store.get<Saved>(keys.feedback(worryId)));

  const save = (next: Saved) => {
    setSaved(next);
    store.set(keys.feedback(worryId), next);
    sendRating({ worry: worryId, verdict, answer: next.answer, tone: next.tone });
    toast(apiEnabled ? "Thanks. Only the rating and verdict type are sent, anonymously." : "Thanks. Saved on this phone only.");
  };

  return (
    <div className="rounded-[22px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="font-display text-[1.1875rem] leading-snug">Did this help?</h2>
        <div role="group" aria-label="Did this answer what you needed?" className="flex flex-wrap gap-2">
          {ANSWERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={saved?.answer === id}
              onClick={() => save({ answer: id, at: Date.now() })}
              className={chip(saved?.answer === id)}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {saved && (
        <div role="group" aria-label="How did it feel?" className="mt-3 flex animate-fade-up flex-wrap gap-2">
          {TONES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={saved.tone === id}
              onClick={() => save({ ...saved, tone: id, at: Date.now() })}
              className={chip(saved.tone === id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-2.5 text-small text-ink-muted">
        {apiEnabled ? "Sends only your rating and the verdict type, anonymously." : "Kept on this phone. Not sent anywhere."}
      </p>
    </div>
  );
}
