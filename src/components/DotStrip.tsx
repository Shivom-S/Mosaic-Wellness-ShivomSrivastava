import type { TrendResult } from "@/content";
import { DOT_TONE } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface DotStripProps {
  /** How many slots to draw (14, 7, …). */
  total: number;
  /** One status per logged entry. */
  dots: TrendResult["dots"];
  /** Index of today's (still empty) slot, drawn as an outlined lamp ring. */
  todayIndex?: number;
  /** What a slot is called, for the screen-reader summary. */
  unit?: string;
  className?: string;
}

export function DotStrip({ total, dots, todayIndex, unit = "day", className }: DotStripProps) {
  const slots = Math.max(total, dots.length);
  const wide = slots <= 8;
  const summary =
    dots.length === 0
      ? `Nothing logged yet, ${slots} ${unit}s to go`
      : `${dots.length} of ${slots} ${unit}s logged: ` +
        (["good", "meh", "bad"] as const)
          .map((k) => [dots.filter((d) => d === k).length, DOT_TONE[k].label] as const)
          .filter(([n]) => n > 0)
          .map(([n, l]) => `${n} ${l}`)
          .join(", ");

  return (
    <div role="img" aria-label={summary} className={cn("flex", wide ? "gap-2" : "gap-1.5", className)}>
      {Array.from({ length: slots }, (_, i) => {
        const status = dots[i];
        const isToday = status === undefined && i === todayIndex;
        return (
          <span
            key={i}
            className={cn(
              "aspect-square flex-1 rounded-full transition-colors duration-300",
              wide ? "max-w-9" : "max-w-6",
              status ? DOT_TONE[status].fill : isToday ? "bg-lamp/10 ring-2 ring-lamp" : "bg-line/60",
            )}
          />
        );
      })}
    </div>
  );
}
