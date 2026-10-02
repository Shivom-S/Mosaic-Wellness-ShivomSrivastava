import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  title: string;
  /** Zero-based index of the current screen. */
  step: number;
  steps: number;
  /** "Question" for a question, "Step" for anything else (the hair counter). */
  noun?: "Question" | "Step";
  backLabel: string;
  onBack: () => void;
  /** Less space below, for a screen that needs the room. */
  tight?: boolean;
}

/** Back button, "Question 2 of 5" in words, and the bar: the goal-gradient cue for every check screen. */
export function StepProgress({ title, step, steps, noun = "Question", backLabel, onBack, tight = false }: StepProgressProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="-ml-2 inline-flex size-12 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate text-small font-medium text-ink-muted">{title}</p>
        <p className="num shrink-0 text-body font-semibold text-ink">
          {noun} {step + 1} of {steps}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={1}
        aria-valuemax={steps}
        aria-valuenow={step + 1}
        aria-valuetext={`${noun} ${step + 1} of ${steps}`}
        className={cn("mt-2 h-2 overflow-hidden rounded-full bg-line", tight ? "mb-4" : "mb-8")}
      >
        <div
          className="h-full rounded-full bg-lamp transition-[width] duration-300 ease-out"
          style={{ width: `${((step + 1) / steps) * 100}%` }}
        />
      </div>
    </>
  );
}
