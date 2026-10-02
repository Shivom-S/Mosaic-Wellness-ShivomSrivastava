import { PenLine } from "lucide-react";
import type { HairCount, Result } from "@/content";
import { totalCount } from "@/content/hair";
import { TONE, toneLabel } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface VerdictCardProps {
  result: Pick<Result, "verdict" | "headline" | "urgency">;
  /** Hair only: shown big, so the number you counted doesn't get lost in the headline. */
  count?: HairCount;
  /** An AI-written answer says so, right on the card. */
  ai?: boolean;
}

export function VerdictCard({ result, count, ai = false }: VerdictCardProps) {
  const tone = TONE[result.verdict];
  const Icon = tone.icon;
  const Deco = tone.deco;
  const n = count ? totalCount(count) : null;

  return (
    <section
      aria-live="polite"
      className={cn("relative overflow-hidden rounded-[28px] border p-6 pb-7", tone.card)}
    >
      <Deco
        aria-hidden="true"
        strokeWidth={1.25}
        className={cn("pointer-events-none absolute -right-5 -top-5 size-36 opacity-[0.12]", tone.text)}
      />

      <div className="relative flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex animate-pop-in items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-[0.09em]",
            tone.pill,
          )}
        >
          <Icon className="size-4" strokeWidth={2.75} aria-hidden="true" />
          {toneLabel(result.verdict)}
        </span>
        {ai && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-faint/60 px-3 py-[7px] text-xs font-bold uppercase tracking-[0.09em] text-ink-muted">
            <PenLine className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
            AI-written
          </span>
        )}
      </div>

      {n !== null && (
        <p className="relative mt-5 flex items-baseline gap-2.5">
          <span className="num font-display text-[76px] leading-none tracking-tight text-ink">{n}</span>
          <span className="font-display text-2xl italic text-ink-muted">{n === 1 ? "hair" : "hairs"}</span>
        </p>
      )}

      <h1
        className={cn(
          "relative font-display text-[32px] leading-[1.12] tracking-[-0.01em] text-ink",
          n !== null ? "mt-3" : "mt-5",
        )}
      >
        {result.headline}
      </h1>

      <p className="relative mt-3 text-[13px] leading-snug text-ink-muted">
        Based on what you told us. This isn't a diagnosis.
      </p>

      {result.urgency && <p className="relative mt-3 text-[17px] font-bold text-doctor">{result.urgency}</p>}
    </section>
  );
}
