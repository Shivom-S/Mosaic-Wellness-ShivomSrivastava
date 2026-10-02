import { Lock } from "lucide-react";
import type { AiCheck } from "@/lib/api";

/** Laptop-only side panel for an AI-built check. Says plainly what it is, and what it isn't. */
export function AiAbout({ check, text, step }: { check: AiCheck; text: string; step: number }) {
  return (
    <aside
      aria-label="About this check"
      className="sticky top-24 hidden animate-fade-up rounded-[28px] border border-line bg-surface p-7 lg:col-span-5 lg:block"
    >
      <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-lamp">About this check</p>
      <h2 className="mt-2 font-display text-[28px] leading-tight text-ink">{check.title}</h2>
      {check.whisper && <p className="mt-2 font-display text-[19px] italic leading-snug text-ink-muted">“{check.whisper}”</p>}

      <h3 className="mt-6 text-[15px] font-semibold text-ink">You wrote</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">“{text}”</p>

      <h3 className="mt-6 text-[15px] font-semibold text-ink">What we'll ask ({check.questions.length} quick taps)</h3>
      <ol className="mt-2.5 space-y-1.5">
        {check.questions.map((q, i) => (
          <li
            key={q.id}
            aria-current={i === step ? "step" : undefined}
            className={`flex gap-3 text-[14px] leading-snug ${i === step ? "font-medium text-ink" : "text-ink-muted"}`}
          >
            <span className="num w-5 shrink-0 text-ink-faint">{i + 1}</span>
            <span>{q.prompt}</span>
          </li>
        ))}
      </ol>

      <p className="mt-6 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] leading-snug text-ink-muted">
        AI-written check. 1AM's seven reviewed checks use cited rules; this one doesn't.
      </p>
      <p className="mt-3 flex items-start gap-2.5 text-[13px] leading-snug text-ink-muted">
        <Lock className="mt-0.5 size-4 shrink-0 text-lamp" aria-hidden="true" />
        Your words and answers go to an AI model to write the answer. 1AM doesn't store them, and the result is saved on this phone only.
      </p>
    </aside>
  );
}
