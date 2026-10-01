import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { WORRY, type Answers, type HairCount, type WorryId } from "@/content";
import { HairCounter, NO_HAIRS } from "@/components/HairCounter";
import { QuestionFlow } from "@/components/QuestionFlow";
import { replaceRoute } from "@/lib/route";
import { keys, store, type SavedCheck } from "@/lib/storage";

export function Check({ id }: { id: WorryId }) {
  const worry = WORRY[id];
  const counting = worry.check === "count";
  const offset = counting ? 1 : 0;
  const steps = offset + worry.questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [count, setCount] = useState<HairCount>(NO_HAIRS);

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
    if (step === 0) window.location.hash = "#/";
    else setStep(step - 1);
  };

  const qIndex = step - offset;
  const question = qIndex >= 0 ? worry.questions[qIndex] : undefined;

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={back}
          aria-label={step === 0 ? "Back to home" : "Previous question"}
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
        className="mb-8 mt-2 h-1 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-lamp transition-[width] duration-300 ease-out"
          style={{ width: `${((step + 1) / steps) * 100}%` }}
        />
      </div>

      {counting && step === 0 && (
        <div key="count" className="animate-fade-up">
          <HairCounter
            value={count}
            onChange={setCount}
            onDone={(c) => {
              setCount(c);
              setStep(1);
            }}
          />
        </div>
      )}

      {question && (
        <div key={question.id} className="animate-fade-up">
          <QuestionFlow
            question={question}
            answers={answers}
            last={qIndex === worry.questions.length - 1}
            onChange={setAnswers}
            onNext={(a) => {
              setAnswers(a);
              if (qIndex === worry.questions.length - 1) finish(a, count);
              else setStep(step + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
