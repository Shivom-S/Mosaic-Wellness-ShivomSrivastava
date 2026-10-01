import { Lock } from "lucide-react";
import { WORRY_SOURCES, type Worry } from "@/content";
import { Sources } from "@/components/Sources";

/** Laptop-only side panel for a check: what this is, what we'll ask, where it comes from. */
export function AboutCheck({ worry, steps, step }: { worry: Worry; steps: number; step: number }) {
  const counting = worry.check === "count";
  const asks = [...(counting ? ["Count tonight's hairs"] : []), ...worry.questions.map((q) => q.prompt)];

  return (
    <aside
      aria-label="About this check"
      className="sticky top-24 hidden animate-fade-up rounded-[28px] border border-line bg-surface p-7 lg:col-span-5 lg:block"
    >
      <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-lamp">About this check</p>
      <h2 className="mt-2 font-display text-[28px] leading-tight text-ink">{worry.title}</h2>
      <p className="mt-2 font-display text-[19px] italic leading-snug text-ink-muted">“{worry.whisper}”</p>

      <h3 className="mt-6 text-[15px] font-semibold text-ink">What we'll ask ({steps} quick taps)</h3>
      <ol className="mt-2.5 space-y-1.5">
        {asks.map((a, i) => (
          <li
            key={a}
            aria-current={i === step ? "step" : undefined}
            className={`flex gap-3 text-[14px] leading-snug ${i === step ? "font-medium text-ink" : "text-ink-muted"}`}
          >
            <span className="num w-5 shrink-0 text-ink-faint">{i + 1}</span>
            <span>{a}</span>
          </li>
        ))}
      </ol>

      <h3 className="mt-6 text-[15px] font-semibold text-ink">Where the numbers come from</h3>
      <div className="mt-1">
        <Sources ids={WORRY_SOURCES[worry.id]} collapsible={false} />
      </div>

      <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] leading-snug text-ink-muted">
        <Lock className="mt-0.5 size-4 shrink-0 text-lamp" aria-hidden="true" />
        Your answers stay on this device. No account, and your answers are never sent anywhere.
      </p>
    </aside>
  );
}
