import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Answers, Question } from "@/content";
import { ChipGroup } from "@/components/ChipGroup";
import { btn } from "@/lib/ui";

interface QuestionFlowProps {
  question: Question;
  answers: Answers;
  last: boolean;
  onChange: (next: Answers) => void;
  /** Gets the up-to-date answers, so the caller never reads stale state. */
  onNext: (answers: Answers) => void;
  /** Shown in place of the Continue button (and under the chips on single-select), e.g. while the answer is written. */
  status?: ReactNode;
  /** Freeze the chips, e.g. while the answer is being written. */
  busy?: boolean;
}

/** One question on screen. Single-select advances by itself after a short highlight. */
export function QuestionFlow({ question: q, answers, last, onChange, onNext, status, busy = false }: QuestionFlowProps) {
  const timer = useRef<number | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  const value = answers[q.id] ?? [];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const pick = (next: string[]) => {
    if (locked) return;
    const merged = { ...answers, [q.id]: next };
    onChange(merged);
    if (q.multi) return;
    setLocked(true);
    timer.current = window.setTimeout(() => onNext(merged), 180);
  };

  return (
    <div>
      <header className="animate-fade-up">
        <h1 className="font-display text-[30px] leading-[1.15] tracking-[-0.01em]">{q.prompt}</h1>
        {q.help && <p className="mt-2.5 text-[15px] leading-relaxed text-ink-muted">{q.help}</p>}
        {q.multi && <p className="mt-2.5 text-[13px] font-bold uppercase tracking-[0.09em] text-ink-faint">Pick all that apply</p>}
      </header>

      <div className="mt-6 animate-fade-up" style={{ animationDelay: "70ms" }}>
        <ChipGroup
          label={q.prompt}
          options={q.options}
          value={value}
          multi={q.multi}
          layout="stack"
          disabled={locked || busy}
          onChange={pick}
        />
      </div>

      {(q.multi || status) && (
        <div className="mt-8 animate-fade-up" style={{ animationDelay: "140ms" }} aria-live="polite">
          {status ?? (
            <button
              type="button"
              disabled={value.length === 0}
              onClick={() => onNext(answers)}
              className={btn("primary", "w-full")}
            >
              {last ? "See my answer →" : "Continue →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
