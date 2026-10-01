import { useState } from "react";
import { toast } from "sonner";
import { Meh, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import type { WorryId } from "@/content";
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
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-full border px-4 text-[14px] font-medium transition duration-150 active:scale-[0.97]",
    on ? "border-lamp bg-lamp/15 text-ink" : "border-line bg-surface text-ink hover:border-lamp/60 hover:bg-surface-2",
  );

/** "Did this answer what you needed?" Saved to this phone only: nothing is sent anywhere. */
export function Feedback({ worryId }: { worryId: WorryId }) {
  const [saved, setSaved] = useState<Saved | null>(() => store.get<Saved>(keys.feedback(worryId)));

  const save = (next: Saved) => {
    setSaved(next);
    store.set(keys.feedback(worryId), next);
    toast("Thanks. Saved on this phone only, nothing is sent anywhere.");
  };

  return (
    <div className="rounded-[28px] border border-line bg-surface p-5">
      <h2 className="font-display text-[20px] leading-snug">Did this answer what you needed?</h2>

      <div role="group" aria-label="Did this answer what you needed?" className="mt-3.5 flex flex-wrap gap-2">
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

      {saved && (
        <div className="mt-4 animate-fade-up">
          <p className="mb-2 text-[13px] text-ink-muted">And how did it feel?</p>
          <div role="group" aria-label="How did it feel?" className="flex flex-wrap gap-2">
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
        </div>
      )}

      <p className="mt-3.5 text-[12px] leading-snug text-ink-muted">Kept on this phone. Not sent to us or anyone else.</p>
    </div>
  );
}
