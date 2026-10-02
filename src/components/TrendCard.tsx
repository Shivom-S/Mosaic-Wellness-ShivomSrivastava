import type { CSSProperties } from "react";
import type { TrendResult, WorryId } from "@/content";
import { MiniChart } from "@/components/MiniChart";
import { TONE, toneLabel } from "@/lib/ui";
import { cn } from "@/lib/utils";

const CHART: Record<WorryId, { caption: string; unit: string }> = {
  hair: { caption: "Hairs counted each day", unit: "Day" },
  cycle: { caption: "Days between period starts", unit: "Cycle" },
  sleep: { caption: "Minutes awake each night", unit: "Night" },
  toddler: { caption: "Meal score each day (3 to 9)", unit: "Day" },
  acne: { caption: "New spots each day", unit: "Day" },
  dandruff: { caption: "Itch score each day (1 to 3)", unit: "Day" },
  reflux: { caption: "Burn each night (0 none, 1 mild, 2 bad)", unit: "Night" },
};

interface TrendCardProps {
  trend: TrendResult;
  worryId: WorryId;
  className?: string;
  style?: CSSProperties;
}

export function TrendCard({ trend, worryId, className, style }: TrendCardProps) {
  const tone = TONE[trend.verdict];
  const Icon = tone.icon;
  const { caption, unit } = CHART[worryId];
  const label = (l: string | undefined) => (l && /^\d+$/.test(l) ? `${unit} ${l}` : l);
  const series = trend.series ?? [];

  return (
    <section
      aria-live="polite"
      style={style}
      className={cn("animate-fade-up rounded-[28px] border p-5", tone.card, className)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.09em]",
          tone.pill,
        )}
      >
        <Icon className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
        {trend.verdict === "early" ? toneLabel("early") : `Trend: ${toneLabel(trend.verdict)}`}
      </span>

      <h3 className="mt-3.5 font-display text-[26px] leading-[1.15] text-ink">{trend.headline}</h3>

      <div className="mt-2.5 space-y-2 text-[15px] leading-relaxed text-ink-muted">
        {trend.detail.map((d, i) => (
          <p key={i}>{d}</p>
        ))}
      </div>

      {series.length > 0 && (
        <div className="mt-5 rounded-2xl bg-bg/50 px-3.5 pb-3 pt-3">
          <MiniChart
            series={series}
            tones={trend.dots}
            reference={trend.reference}
            caption={caption}
            startLabel={label(series[0].label)}
            endLabel={series.length > 1 ? label(series[series.length - 1].label) : undefined}
          />
          <p className="mt-1 text-center text-[11px] text-ink-faint">{caption}</p>
        </div>
      )}
    </section>
  );
}
