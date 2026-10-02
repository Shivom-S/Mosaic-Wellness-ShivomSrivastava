import { ArrowRight, Search, type LucideIcon } from "lucide-react";
import { POPULAR, WORRIES, type Verdict, type WorryId } from "@/content";
import { IconBadge } from "@/components/IconBadge";
import { relativeTime } from "@/lib/clock";
import { AI_ICON, WORRY_ICON } from "@/lib/icons";
import { href } from "@/lib/route";
import { loadAiHistory, loadLast, setAiLast, useStoreVersion, type AiSaved } from "@/lib/storage";
import { TONE, stagger, toneLabel } from "@/lib/ui";

/** Grouped example questions. Tapping one fills the box and goes straight to that worry's check. */
export function Popular({ onPick }: { onPick: (q: string, worry: WorryId) => void }) {
  return (
    <section aria-labelledby="popular-title">
      <h2 id="popular-title" className="font-display text-[22px] leading-snug">
        Popular at 1 AM
      </h2>
      <p className="mt-1 text-[14px] text-ink-muted">Other people typed these. Tap one to start.</p>
      <div className="mt-4 space-y-4">
        {POPULAR.map((g) => (
          <div key={g.group}>
            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.09em] text-lamp">{g.group}</h3>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((it) => (
                <li key={it.q}>
                  <button
                    type="button"
                    onClick={() => onPick(it.q, it.worry)}
                    className="min-h-11 touch-manipulation rounded-[22px] border border-line bg-surface px-4 py-2.5 text-left text-[14px] leading-snug text-ink transition duration-150 hover:border-lamp/60 hover:bg-surface-2 active:scale-[0.98]"
                  >
                    {it.q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/** A small, tasteful nudge to close the other tabs. */
export function StopTheSpiral() {
  return (
    <section
      aria-label="Stop the spiral"
      className="flex items-start gap-4 rounded-[28px] border border-dashed border-line px-5 py-5 lg:items-center lg:gap-5 lg:px-8"
    >
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lamp lg:mt-0">
        <Search className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-[20px] leading-snug text-ink lg:text-[22px]">
          Google: 10,000 results. <em className="italic text-lamp">1AM: one clear next step.</em>
        </p>
        <p className="mt-1 text-[14px] leading-snug text-ink-muted">You probably don't need 14 more tabs right now.</p>
      </div>
    </section>
  );
}

const STEPS = [
  ["01", "Tell us what's worrying you", "Type it, say it, or just pick a card. English or Hinglish."],
  ["02", "A few quick taps, no typing", "Short questions with big buttons. About a minute."],
  ["03", "The honest answer", "What to do tonight, and when to get help."],
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-6">
      <h2 id="how-title" className="font-display text-[26px] leading-snug lg:text-[30px]">
        How it works
      </h2>
      <ol className="mt-5 grid gap-3 lg:grid-cols-3 lg:gap-5">
        {STEPS.map(([n, title, body], i) => (
          <li
            key={n}
            style={stagger(i, 60)}
            className="rounded-[28px] border border-line bg-surface px-5 py-5 lg:px-6 lg:py-6"
          >
            <span className="num font-display text-[34px] italic leading-none text-lamp">{n}</span>
            <h3 className="mt-3 text-[16px] font-semibold leading-snug text-ink">{title}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">{body}</p>
          </li>
        ))}
      </ol>
    </section>
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

/** "Your midnight questions": every saved check (and up to 5 AI-written ones), newest first. Nothing leaves this phone. */
export function History() {
  useStoreVersion(); // re-read after a wipe or a new check
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

  return (
    <section aria-labelledby="history-title">
      <h2 id="history-title" className="font-display text-[22px] leading-snug">
        Your midnight questions
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 rounded-[22px] border border-dashed border-line px-5 py-4 text-[14px] leading-relaxed text-ink-muted">
          This is where your finished checks land, only on this phone. Pick a worry above to start one.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((it) => {
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
                      <span className="block truncate text-[15px] font-semibold text-ink">{it.title}</span>
                      <span className="mt-0.5 block text-[13px] text-ink-muted">
                        {relativeTime(it.at)}
                        {it.ai && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-ink-faint/60 px-2 py-px text-[10px] font-bold uppercase tracking-[0.09em] text-ink-muted">
                            AI-written
                          </span>
                        )}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.09em] ${tone.pill}`}
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
      )}
    </section>
  );
}
