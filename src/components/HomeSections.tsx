import { useState } from "react";
import {
  ArrowRight,
  CircleCheckBig,
  ListChecks,
  Lock,
  MessageCircleQuestion,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { QUICK_QUESTIONS, WORRIES, type Verdict } from "@/content";
import { IconBadge } from "@/components/IconBadge";
import { relativeTime } from "@/lib/clock";
import { AI_ICON, WORRY_ICON } from "@/lib/icons";
import { clearAllPrefill } from "@/lib/prefill";
import { href } from "@/lib/route";
import { loadAiHistory, loadLast, setAiLast, useStoreVersion, type AiSaved } from "@/lib/storage";
import { TONE, stagger, toneLabel } from "@/lib/ui";
import { cn } from "@/lib/utils";

// Taps highlight at once (75ms), well inside the 100ms mark.
const CELL =
  "flex h-full min-h-[84px] w-full touch-manipulation flex-col items-start gap-2 rounded-[22px] border border-line bg-surface p-3.5 text-left text-body font-medium transition duration-75 hover:border-lamp/60 hover:bg-surface-2 active:scale-[0.97] active:border-lamp active:bg-lamp/15 lg:min-h-[96px] lg:p-4";

/** Eight example questions. Seven open that worry's check; the last one hands the cursor to the search box. */
export function QuestionCells({ onType }: { onType: () => void }) {
  return (
    <section aria-label="Common worries">
      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
        {QUICK_QUESTIONS.map((q, i) => (
          <li key={q.worry} className="animate-fade-up" style={stagger(i, 30)}>
            <a href={href({ name: "check", id: q.worry })} onClick={clearAllPrefill} className={CELL}>
              <IconBadge icon={WORRY_ICON[q.worry]} />
              <span className="leading-normal">{q.label}</span>
            </a>
          </li>
        ))}
        <li className="animate-fade-up" style={stagger(QUICK_QUESTIONS.length, 30)}>
          <button type="button" onClick={onType} className={cn(CELL, "border-dashed")}>
            <IconBadge icon={AI_ICON} />
            <span className="leading-normal">Something else? Type it</span>
          </button>
        </li>
      </ul>
      <p className="mt-3 text-small text-ink-muted">For yourself, your child or a parent.</p>
    </section>
  );
}

const STEPS: { icon: LucideIcon; label: string }[] = [
  { icon: MessageCircleQuestion, label: "Ask your question" },
  { icon: ListChecks, label: "Tap a few answers" },
  { icon: CircleCheckBig, label: "Get a clear next step" },
];

/** Three steps in one row, joined by a thin progress line. */
export function HowItWorks() {
  return (
    <section id="how" aria-label="How it works" className="scroll-mt-6">
      <ol className="relative grid grid-cols-3 gap-2">
        <span aria-hidden="true" className="absolute left-[16.7%] right-[16.7%] top-6 h-0.5 rounded-full bg-line" />
        {STEPS.map(({ icon: Icon, label }, i) => (
          <li key={label} className="relative flex flex-col items-center gap-2 text-center">
            <span
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-full border-2 border-line bg-bg text-lamp"
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="text-small font-medium leading-normal text-ink">
              <span className="sr-only">Step {i + 1}: </span>
              {label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const TRUST: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "Cited sources" },
  { icon: Lock, label: "No sign-up" },
  { icon: Smartphone, label: "Stays on your phone" },
];

export function TrustRow() {
  return (
    <ul className="flex flex-wrap gap-2">
      {TRUST.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-small font-medium text-ink-muted"
        >
          <Icon className="size-4 shrink-0 text-lamp" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

interface HistoryItem {
  key: string;
  title: string;
  icon: LucideIcon;
  verdict: Verdict;
  at: number;
  to: string;
  ai?: AiSaved;
}

const SHOWN = 3;

/** "Your past checks": the three newest, with the rest one tap away. Renders nothing when there are none. */
export function History() {
  useStoreVersion(); // re-read after a wipe or a new check
  const [all, setAll] = useState(false);
  const items: HistoryItem[] = [
    ...WORRIES.flatMap((w) => {
      const saved = loadLast(w.id);
      return saved ? [{ key: w.id, title: w.title, icon: WORRY_ICON[w.id], verdict: saved.result.verdict, at: saved.at, to: href({ name: "result", id: w.id }) }] : [];
    }),
    ...loadAiHistory().map((e) => ({
      key: `ai-${e.at}`,
      title: e.check.title,
      icon: AI_ICON,
      verdict: e.result.verdict,
      at: e.at,
      to: href({ name: "ai-result" }),
      ai: e,
    })),
  ].sort((a, b) => b.at - a.at);

  if (items.length === 0) return null;
  const shown = all ? items : items.slice(0, SHOWN);

  return (
    <section aria-labelledby="history-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="history-title" className="font-display text-[1.375rem] leading-snug">
          Your past checks
        </h2>
        {items.length > SHOWN && (
          <button
            type="button"
            onClick={() => setAll((a) => !a)}
            aria-expanded={all}
            className="inline-flex min-h-12 items-center rounded-xl px-1 text-small font-semibold text-lamp underline-offset-4 hover:underline"
          >
            {all ? "Show fewer" : `See all ${items.length}`}
          </button>
        )}
      </div>
      <ul className="mt-1 space-y-2.5">
        {shown.map((it) => {
          const tone = TONE[it.verdict];
          const Icon = tone.icon;
          return (
            <li key={it.key}>
              <a
                href={it.to}
                // an AI result is shown from "1am:ai:last", so make this entry the one on screen first
                onClick={it.ai ? () => setAiLast(it.ai!) : undefined}
                className="group flex min-h-[64px] items-center justify-between gap-3 rounded-[22px] border border-line bg-surface px-4 py-3 transition-colors hover:border-lamp/50 hover:bg-surface-2"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <IconBadge icon={it.icon} />
                  <span className="min-w-0">
                    <span className="block truncate text-body font-semibold text-ink">{it.title}</span>
                    <span className="block text-small text-ink-muted">
                      {relativeTime(it.at)}
                      {it.ai && " · AI-written"}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-small font-bold ${tone.pill}`}
                  >
                    <Icon className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
                    {toneLabel(it.verdict)}
                  </span>
                  <ArrowRight
                    className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-lamp"
                    aria-hidden="true"
                  />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
