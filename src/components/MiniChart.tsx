import type { TrendResult } from "@/content";
import { DOT_TONE } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface MiniChartProps {
  series: NonNullable<TrendResult["series"]>;
  /** Per-bar status, aligned to `series`. Colours the bars. */
  tones?: TrendResult["dots"];
  reference?: TrendResult["reference"];
  /** Spoken summary, e.g. "Hairs a day". */
  caption: string;
  startLabel?: string;
  endLabel?: string;
  /** Tiny version for cards: no axis, no reference label. */
  compact?: boolean;
  className?: string;
}

const W = 320;

export function MiniChart({ series, tones, reference, caption, startLabel, endLabel, compact, className }: MiniChartProps) {
  if (series.length === 0) return null;

  const H = compact ? 44 : 132;
  const top = compact ? 4 : 18;
  const bottom = 2;
  const plot = H - top - bottom;
  const max = Math.max(...series.map((s) => s.value), reference ? reference.value * 1.12 : 0, 1);
  const slot = W / series.length;
  const barW = Math.min(slot * 0.64, 24);
  const y = (v: number) => top + plot - (v / max) * plot;
  const refY = reference ? y(reference.value) : 0;

  return (
    <figure className={cn("m-0", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${caption}: ${series.map((s) => s.value).join(", ")}${reference ? `. Normal is up to ${reference.value}.` : ""}`}
        className="block h-auto w-full overflow-visible"
      >
        {series.map((s, i) => {
          const h = Math.max(2, (s.value / max) * plot);
          const tone = tones?.[i];
          return (
            <rect
              key={i}
              x={slot * i + (slot - barW) / 2}
              y={top + plot - h}
              width={barW}
              height={h}
              rx={Math.min(4, barW / 2)}
              className={cn("animate-grow-y", tone ? DOT_TONE[tone].bar : "fill-ink-faint")}
              style={{ animationDelay: `${i * 28}ms` }}
            />
          );
        })}

        {reference && (
          <g>
            <line
              x1={0}
              x2={W}
              y1={refY}
              y2={refY}
              strokeDasharray="4 4"
              strokeWidth={compact ? 1 : 1.25}
              className="stroke-ink-muted"
            />
            {!compact && (
              <text x={W} y={refY - 5} textAnchor="end" fontSize={11} className="fill-ink-muted font-sans">
                {reference.label}
              </text>
            )}
          </g>
        )}
        <line x1={0} x2={W} y1={H - bottom + 0.5} y2={H - bottom + 0.5} strokeWidth={1} className="stroke-line" />
      </svg>

      {!compact && (startLabel || endLabel) && (
        <figcaption className="mt-2 flex justify-between text-small tracking-wide text-ink-muted">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </figcaption>
      )}
    </figure>
  );
}
