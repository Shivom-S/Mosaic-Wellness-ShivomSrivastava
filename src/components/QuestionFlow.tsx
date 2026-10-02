import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Answers, Question } from "@/content";
import { ChipGroup } from "@/components/ChipGroup";
import { btn } from "@/lib/ui";

/** Miller's law: show at most this many options at once. */
const MAX_VISIBLE = 6;

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
  const [expanded, setExpanded] = useState(false);
  const value = answers[q.id] ?? [];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Long lists show six options and a "More options" button. An answer that was already
  // picked (say, pre-filled) is never left hidden.
  const pickedBeyond = q.options.slice(MAX_VISIBLE).some((o) => value.includes(o.id));
  const collapsed = q.options.length > MAX_VISIBLE && !expanded && !pickedBeyond;
  const options = collapsed ? q.options.slice(0, MAX_VISIBLE) : q.options;

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
        <h1 className="font-display text-[1.875rem] leading-[1.15] tracking-[-0.01em]">{q.prompt}</h1>
        {q.help && <p className="mt-2.5 text-body text-ink-muted">{q.help}</p>}
        {q.multi && <p className="mt-2.5 text-small font-bold uppercase tracking-[0.06em] text-ink-muted">Pick all that apply</p>}
      </header>

      <div className="mt-6 animate-fade-up" style={{ animationDelay: "70ms" }}>
        <ChipGroup
          label={q.prompt}
          options={options}
          value={value}
          multi={q.multi}
          layout="stack"
          disabled={locked || busy}
          onChange={pick}
        />
        {collapsed && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-2.5 inline-flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-body font-semibold text-lamp transition duration-75 hover:bg-surface active:scale-[0.985] active:bg-lamp/15"
          >
            More options
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        )}
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
