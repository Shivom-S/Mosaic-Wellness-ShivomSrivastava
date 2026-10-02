import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { WORRIES, WORRY, type WorryId } from "@/content";
import { DotStrip } from "@/components/DotStrip";
import { Section } from "@/components/Section";
import { TrendCard } from "@/components/TrendCard";
import { href } from "@/lib/route";
import { btn, stagger } from "@/lib/ui";

export function Example({ id }: { id: WorryId }) {
  const worry = WORRY[id];
  const tracker = worry.tracker;
  const { example } = worry;
  const trend = useMemo(() => tracker.trend(example.entries), [tracker, example]);

  const persona = example.persona.replace(/^Example:\s*/i, "");
  const span =
    tracker.kind === "daily"
      ? `${tracker.days} ${tracker.unitLabel}s of logging`
      : `${example.entries.length} period dates`;

  return (
    <div className="space-y-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-14 lg:space-y-0">
      <div className="space-y-8 lg:col-span-7">
        <div className="animate-fade-up">
          <a
            href={href({ name: "home" })}
            aria-label="Back to home"
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </a>

          <p className="mt-2 inline-flex items-center rounded-full border border-dashed border-ink-faint px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-ink-muted">
            Example · not a real person
          </p>
          <h1 className="mt-4 font-display text-[32px] italic leading-[1.1] tracking-[-0.01em] lg:text-[44px]">{persona}</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-muted lg:text-[17px]">{example.context}</p>
        </div>

        {/* Phone: the trend follows the story. Laptop: it sits beside it (below). */}
        <Section title={`${span}, in one glance`} style={stagger(1)} className="lg:hidden">
          <DotStrip
            total={trend.dots.length}
            dots={trend.dots}
            unit={tracker.kind === "daily" ? tracker.unitLabel : "cycle"}
          />
          <div className="mt-5">
            <TrendCard trend={trend} worryId={id} />
          </div>
        </Section>

        <Section style={stagger(2)}>
          <div className="space-y-5">
            <a href={href({ name: "check", id })} className={btn("primary", "w-full lg:w-auto")}>
              Start my own check →
            </a>
            <div>
              <p className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.09em] text-ink-faint">See other examples</p>
              <div className="flex flex-wrap gap-2">
                {WORRIES.filter((w) => w.id !== id).map((w) => (
                  <a
                    key={w.id}
                    href={href({ name: "example", id: w.id })}
                    className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-[14px] text-ink transition-colors hover:border-lamp/60 hover:bg-surface-2"
                  >
                    {w.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>

      <aside aria-label="The trend" className="hidden animate-fade-up lg:sticky lg:top-24 lg:col-span-5 lg:block">
        <p className="mb-3 font-display text-[22px] leading-snug">{span}, in one glance</p>
        <DotStrip
          total={trend.dots.length}
          dots={trend.dots}
          unit={tracker.kind === "daily" ? tracker.unitLabel : "cycle"}
        />
        <div className="mt-5">
          <TrendCard trend={trend} worryId={id} />
        </div>
      </aside>
    </div>
  );
}
