import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { WORRY, type DailyEntry, type WorryId } from "@/content";
import { DotStrip } from "@/components/DotStrip";
import { Section } from "@/components/Section";
import { TrackerDaily } from "@/components/TrackerDaily";
import { TrackerDates } from "@/components/TrackerDates";
import { TrendCard } from "@/components/TrendCard";
import { WipeButton } from "@/components/WipeButton";
import { href } from "@/lib/route";
import { keys, loadEntries, saveEntries } from "@/lib/storage";
import { todayISO, trackStatus } from "@/lib/track";
import { stagger } from "@/lib/ui";

export function Track({ id }: { id: WorryId }) {
  const worry = WORRY[id];
  const tracker = worry.tracker;
  const [entries, setEntries] = useState<DailyEntry[]>(() => loadEntries(id));
  const trendRef = useRef<HTMLDivElement>(null);

  const trend = useMemo(() => tracker.trend(entries), [tracker, entries]);
  const status = trackStatus(worry, entries);
  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);

  const scrollToTrend = () =>
    requestAnimationFrame(() =>
      trendRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      }),
    );

  const saveToday = (values: DailyEntry["values"]) => {
    const rest = entries.filter((e) => e.date !== today);
    const next = saveEntries(id, [...rest, { date: today, values }]);
    setEntries(next);
    const total = tracker.kind === "daily" ? tracker.days : 0;
    toast(
      total && next.length >= total
        ? "Saved. That's the full run. Have a look at the trend."
        : `Saved. ${next.length} of ${total} done. Come back tomorrow.`,
    );
    scrollToTrend();
  };

  const saveDates = (next: DailyEntry[]) => setEntries(saveEntries(id, next));

  const dailyTotal = tracker.kind === "daily" ? tracker.days : 0;
  const shownDots = dailyTotal ? trend.dots.slice(-dailyTotal) : trend.dots;
  const todayIndex = !status.loggedToday && shownDots.length < dailyTotal ? shownDots.length : undefined;

  const heading =
    tracker.kind === "daily"
      ? status.logged >= tracker.days
        ? `${tracker.days} of ${tracker.days} ${tracker.unitLabel}s`
        : `${tracker.unitLabel[0].toUpperCase()}${tracker.unitLabel.slice(1)} ${status.day} of ${tracker.days}`
      : `${entries.length} ${entries.length === 1 ? "date" : "dates"} logged`;

  const showTrend = tracker.kind === "dates" || entries.length > 0;

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2">
          <a
            href={href({ name: "home" })}
            aria-label="Back to home"
            className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </a>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink-muted">{worry.title}</p>
        </div>

        <h1 className="mt-3 font-display text-[36px] leading-[1.05] tracking-[-0.015em]">
          <span className="italic text-lamp">{heading}</span>
        </h1>

        <DotStrip
          className="mt-5"
          total={tracker.kind === "daily" ? tracker.days : Math.max(5, entries.length)}
          dots={shownDots}
          todayIndex={todayIndex}
          unit={tracker.kind === "daily" ? tracker.unitLabel : "cycle"}
        />
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{tracker.prompt}</p>
      </div>

      <Section style={stagger(1)}>
        {tracker.kind === "daily" ? (
          <TrackerDaily
            // remount when a different day's entry loads, so the draft starts from what's saved
            key={`${id}-${todayEntry ? "saved" : "new"}`}
            worryId={id}
            tracker={tracker}
            today={todayEntry}
            onSave={saveToday}
          />
        ) : (
          <TrackerDates entries={entries} onChange={saveDates} />
        )}
      </Section>

      {showTrend && (
        <div ref={trendRef} className="scroll-mt-4">
          <TrendCard trend={trend} worryId={id} />
        </div>
      )}

      <Section style={stagger(2)}>
        <div className="rounded-[22px] border border-dashed border-line px-5 py-4 text-center">
          <p className="text-[14px] leading-relaxed text-ink-muted">
            {tracker.kind === "daily"
              ? "Come back tomorrow. We'll keep your place. (It's saved on this phone only.)"
              : "Add dates whenever you remember them. They're saved on this phone only."}
          </p>
          <WipeButton
            scope={[keys.track(id)]}
            label="Wipe this tracker"
            question="Wipe this tracker?"
            detail="Everything you've logged here will be deleted from this phone. It was never anywhere else."
            onWiped={() => setEntries([])}
            className="mx-auto mt-1"
          />
        </div>
      </Section>
    </div>
  );
}
