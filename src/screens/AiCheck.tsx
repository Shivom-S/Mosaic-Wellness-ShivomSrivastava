import { useEffect, useMemo, useRef, useState } from "react";
import type { Answers } from "@/content";
import { aiAnswer } from "@/lib/api";
import { AiAbout } from "@/components/AiAbout";
import { QuestionFlow } from "@/components/QuestionFlow";
import { StepProgress } from "@/components/StepProgress";
import { replaceRoute } from "@/lib/route";
import { loadAiPending, saveAiResult } from "@/lib/storage";
import { btn } from "@/lib/ui";

/** The questions an AI wrote for a worry the seven reviewed checks don't cover. Same flow, same chips. */
export function AiCheck() {
  const pending = useMemo(() => loadAiPending(), []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // Bumped on a failure so the last question remounts with its chips unlocked, answers intact.
  const [attempt, setAttempt] = useState(0);
  const token = useRef(0);

  useEffect(() => {
    if (!pending) replaceRoute({ name: "home" });
    return () => {
      token.current += 1; // a late reply must not navigate after the person has left
    };
  }, [pending]);

  if (!pending) return null;
  const { text, check } = pending;
  const steps = check.questions.length;
  const question = check.questions[step];

  const finish = async (final: Answers) => {
    const mine = ++token.current;
    setBusy(true);
    setFailed(false);
    const got = await aiAnswer(text, check, final);
    if (mine !== token.current) return;
    setBusy(false);
    if (!got) {
      setFailed(true);
      setAttempt((n) => n + 1);
      return;
    }
    saveAiResult({ text, check, answers: final, result: got.result, urgent: got.urgent, at: Date.now() });
    replaceRoute({ name: "ai-result" });
  };

  const back = () => {
    token.current += 1; // drop any answer still being written
    setBusy(false);
    setFailed(false);
    if (step === 0) window.location.hash = "#/";
    else setStep(step - 1);
  };

  const onLast = step === steps - 1;
  const status = !onLast ? undefined : busy ? (
    <p role="status" className="flex min-h-[52px] items-center justify-center gap-3 text-body text-ink-muted">
      <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-lamp" />
      Putting your answer together…
    </p>
  ) : failed ? (
    <div role="alert" className="rounded-2xl border border-line bg-surface px-4 py-4">
      <p className="text-body text-ink">
        Unable to put your answer together right now. Your answers are still here, so try again.
      </p>
      <button type="button" onClick={() => void finish(answers)} className={btn("primary", "mt-3 w-full")}>
        Try again
      </button>
    </div>
  ) : undefined;

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-14">
      <div className="lg:col-span-7">
        <StepProgress
          title={check.title}
          step={step}
          steps={steps}
          backLabel={step === 0 ? "Back to home" : "Previous question"}
          onBack={back}
        />

        <div key={`${question.id}-${attempt}`} className="animate-fade-up">
          <QuestionFlow
            question={question}
            answers={answers}
            last={onLast}
            busy={busy}
            status={status}
            onChange={setAnswers}
            onNext={(a) => {
              setAnswers(a);
              if (onLast) void finish(a);
              else setStep(step + 1);
            }}
          />
        </div>
      </div>

      <AiAbout check={check} text={text} step={step} />
    </div>
  );
}
