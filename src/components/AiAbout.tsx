import { Lock } from "lucide-react";
import type { AiCheck } from "@/lib/api";

/** Laptop-only side panel for an AI-built check. Says plainly what it is, and what it isn't. */
export function AiAbout({ check, text, step }: { check: AiCheck; text: string; step: number }) {
  return (
    <aside
      aria-label="About this check"
      className="sticky top-24 hidden animate-fade-up rounded-[28px] border border-line bg-surface p-7 lg:col-span-5 lg:block"
    >
      <p className="text-small font-bold uppercase tracking-[0.06em] text-lamp">About this check</p>
      <h2 className="mt-2 font-display text-[1.75rem] leading-tight text-ink">{check.title}</h2>
      {check.whisper && <p className="mt-2 font-display text-[1.1875rem] italic leading-normal text-ink-muted">“{check.whisper}”</p>}

      <h3 className="mt-6 text-body font-semibold text-ink">You wrote</h3>
      <p className="mt-1.5 text-body text-ink-muted">“{text}”</p>

      <h3 className="mt-6 text-body font-semibold text-ink">What we'll ask ({check.questions.length} quick taps)</h3>
      <ol className="mt-2.5 space-y-1.5">
        {check.questions.map((q, i) => (
          <li
            key={q.id}
            aria-current={i === step ? "step" : undefined}
            className={`flex gap-3 text-small ${i === step ? "font-medium text-ink" : "text-ink-muted"}`}
          >
            <span className="num w-5 shrink-0 text-ink-muted">{i + 1}</span>
            <span>{q.prompt}</span>
          </li>
        ))}
      </ol>

      <p className="mt-6 rounded-2xl bg-surface-2 px-4 py-3 text-small text-ink-muted">
        AI-written check. 1AM's seven reviewed checks use cited rules; this one doesn't.
      </p>
      <p className="mt-3 flex items-start gap-2.5 text-small text-ink-muted">
        <Lock className="mt-[0.2em] size-4 shrink-0 text-lamp" aria-hidden="true" />
        Your words and answers go to an AI model to write the answer. 1AM doesn't store them, and the result is saved on this phone only.
      </p>
    </aside>
  );
}
