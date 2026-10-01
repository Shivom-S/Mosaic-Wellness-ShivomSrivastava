import { useMemo } from "react";
import { WORRIES } from "@/content";
import { MiniChart } from "@/components/MiniChart";
import { href } from "@/lib/route";

/** A swipeable row that shows, in seconds, what a couple of weeks of tracking turns into. */
export function ExampleStrip() {
  const items = useMemo(
    () =>
      WORRIES.map((w) => {
        const trend = w.tracker.trend(w.example.entries);
        const label =
          w.tracker.kind === "daily" ? `Example ${w.tracker.days} ${w.tracker.unitLabel}s` : `Example ${w.example.entries.length} dates`;
        return { w, trend, label };
      }),
    [],
  );

  return (
    <section aria-labelledby="pays-off">
      <h2 id="pays-off" className="font-display text-[22px] leading-snug">
        See how tracking pays off
      </h2>
      <p className="mt-1 text-[14px] text-ink-muted">The same worries, a couple of weeks later.</p>

      <ul className="no-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        {items.map(({ w, trend, label }) => (
          <li key={w.id} className="w-[216px] shrink-0 snap-start">
            <a
              href={href({ name: "example", id: w.id })}
              className="flex h-full flex-col rounded-[22px] border border-line bg-surface p-4 transition-colors hover:border-lamp/50 hover:bg-surface-2 active:scale-[0.99]"
            >
              <span className="self-start rounded-full border border-dashed border-ink-faint px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                {label}
              </span>
              <span className="mt-3 text-[15px] font-semibold leading-snug text-ink">{w.title}</span>
              {trend.series && (
                <MiniChart
                  compact
                  className="mt-3"
                  series={trend.series}
                  tones={trend.dots}
                  reference={trend.reference}
                  caption={`${w.title}, example`}
                />
              )}
              <span className="mt-3 font-display text-[16px] italic leading-snug text-ink-muted">{trend.headline}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
