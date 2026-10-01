import { useEffect, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { WORRY, type Answers, type HairCount, type Worry, type WorryId } from "@/content";
import { AboutCheck } from "@/components/AboutCheck";
import { HairCounter, NO_HAIRS } from "@/components/HairCounter";
import { QuestionFlow } from "@/components/QuestionFlow";
import { readPrefill, removePrefill } from "@/lib/prefill";
import { replaceRoute } from "@/lib/route";
import { keys, store, type SavedCheck } from "@/lib/storage";
import { btn } from "@/lib/ui";

/** The pre-filled answers as chips, with the question in small muted type above each group. */
function PrefillChips({ worry, answers, only, labelled }: { worry: Worry; answers: Answers; only: string[]; labelled?: boolean }) {
  const rows = worry.questions
    .filter((q) => only.includes(q.id) && answers[q.id]?.length)
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      labels: q.options.filter((o) => answers[q.id].includes(o.id)).map((o) => o.label),
    }));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id}>
          {labelled && <p className="mb-1.5 text-[13px] leading-snug text-ink-muted">{r.prompt}</p>}
          <div className="flex flex-wrap gap-2">
            {r.labels.map((l) => (
              <span key={l} className="rounded-full border border-lamp/40 bg-surface px-3 py-1.5 text-[14px] leading-snug text-ink">
                {l}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Check({ id }: { id: WorryId }) {
  const worry = WORRY[id];
  const counting = worry.check === "count";
  const offset = counting ? 1 : 0;
  const steps = offset + worry.questions.length;

  // Answers the "say it" box was sure about. Read once, then removed from sessionStorage.
  const [prefilled] = useState<Answers>(() => readPrefill(id));
  useEffect(() => removePrefill(id), [id]);
  const prefIds = Object.keys(prefilled);

  const [skipping, setSkipping] = useState(prefIds.length > 0);
  const [stripOpen, setStripOpen] = useState(true);
  const [answers, setAnswers] = useState<Answers>(prefilled);
  const [count, setCount] = useState<HairCount>(NO_HAIRS);

  // Pre-filled questions are skipped but still count towards "n of N". The hair counter never is.
  const skipped = (i: number) => skipping && i >= offset && prefIds.includes(worry.questions[i - offset].id);
  const nextStep = (from: number) => {
    for (let i = from + 1; i < steps; i++) if (!skipped(i)) return i;
    return null;
  };
  const prevStep = (from: number) => {
    for (let i = from - 1; i >= 0; i--) if (!skipped(i)) return i;
    return null;
  };

  const firstStep = nextStep(-1);
  const [step, setStep] = useState(firstStep ?? steps - 1);
  const [reviewing, setReviewing] = useState(firstStep === null);

  const finish = (finalAnswers: Answers, finalCount?: HairCount) => {
    const result = worry.evaluate({ answers: finalAnswers, count: counting ? finalCount : undefined });
    const saved: SavedCheck = {
      answers: finalAnswers,
      count: counting ? finalCount : undefined,
      result,
      at: Date.now(),
    };
    store.set(keys.last(id), saved);
    replaceRoute({ name: "result", id });
  };

  const back = () => {
    if (reviewing && counting) {
      setReviewing(false);
      setStep(0);
      return;
    }
    const p = reviewing ? null : prevStep(step);
    if (p === null) window.location.hash = "#/";
    else setStep(p);
  };

  // Jump to the first pre-filled question and stop skipping, so every answer can be changed.
  const edit = () => {
    const i = worry.questions.findIndex((q) => prefIds.includes(q.id));
    setSkipping(false);
    setReviewing(false);
    setStripOpen(false);
    setStep(offset + Math.max(i, 0));
  };

  const qIndex = step - offset;
  const question = qIndex >= 0 ? worry.questions[qIndex] : undefined;
  const showStrip = skipping && stripOpen && !reviewing && (step === 0 || step === nextStep(offset - 1));

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-14">
      <div className="lg:col-span-7">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={back}
          aria-label={!reviewing && prevStep(step) === null ? "Back to home" : "Previous question"}
          className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink-muted">{worry.title}</p>
        <p className="num text-sm text-ink-faint">
          {step + 1} of {steps}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={1}
        aria-valuemax={steps}
        aria-valuenow={step + 1}
        className={`${counting && step === 0 ? "mb-4" : "mb-8"} mt-2 h-1 overflow-hidden rounded-full bg-line`}
      >
        <div
          className="h-full rounded-full bg-lamp transition-[width] duration-300 ease-out"
          style={{ width: `${((step + 1) / steps) * 100}%` }}
        />
      </div>

      {showStrip && (
        <div className="mb-6 animate-fade-up rounded-2xl border border-lamp/30 bg-lamp/10 px-4 py-3">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 pt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-lamp">
              From what you wrote
            </p>
            <button
              type="button"
              onClick={() => setStripOpen(false)}
              aria-label="Dismiss"
              className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <PrefillChips worry={worry} answers={answers} only={prefIds} />
          <button
            type="button"
            onClick={edit}
            className="-mb-1 mt-1 inline-flex min-h-11 items-center text-[14px] font-semibold text-lamp underline-offset-4 hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {counting && step === 0 && !reviewing && (
        <div key="count" className="animate-fade-up">
          <HairCounter
            value={count}
            onChange={setCount}
            onDone={(c) => {
              setCount(c);
              const n = nextStep(0);
              if (n === null) {
                setReviewing(true);
                setStep(steps - 1);
              } else setStep(n);
            }}
          />
        </div>
      )}

      {reviewing && (
        <div key="review" className="animate-fade-up">
          <h1 className="font-display text-[30px] leading-[1.15] tracking-[-0.01em]">Here's what we picked up.</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-muted">
            Everything was answered from what you wrote. Change anything that's off.
          </p>
          <div className="mt-5">
            <PrefillChips worry={worry} answers={answers} only={prefIds} labelled />
          </div>
          <div className="mt-8 space-y-1">
            <button type="button" onClick={() => finish(answers, count)} className={btn("primary", "w-full")}>
              See what this means →
            </button>
            <button
              type="button"
              onClick={edit}
              className="inline-flex min-h-11 w-full items-center justify-center text-[14px] font-semibold text-lamp underline-offset-4 hover:underline"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {question && !reviewing && (
        <div key={question.id} className="animate-fade-up">
          <QuestionFlow
            question={question}
            answers={answers}
            last={nextStep(step) === null}
            onChange={setAnswers}
            onNext={(a) => {
              setAnswers(a);
              const n = nextStep(step);
              if (n === null) finish(a, count);
              else setStep(n);
            }}
          />
        </div>
      )}
      </div>

      <AboutCheck worry={worry} steps={steps} step={step} />
    </div>
  );
}
