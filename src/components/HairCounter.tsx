import { useState } from "react";
import { toast } from "sonner";
import type { HairCount } from "@/content";
import { totalCount } from "@/content/hair";
import { rng } from "@/lib/rng";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";

type Loc = keyof HairCount;

const LOCATIONS: { id: Loc; label: string }[] = [
  { id: "pillow", label: "Pillow" },
  { id: "comb", label: "Comb" },
  { id: "drain", label: "Drain" },
  { id: "elsewhere", label: "Elsewhere" },
];

export const NO_HAIRS: HairCount = { pillow: 0, comb: 0, drain: 0, elsewhere: 0 };
const EXAMPLE: HairCount = { pillow: 14, comb: 41, drain: 58, elsewhere: 9 };
const MAX_PER_PLACE = 999;
const MAX_STRANDS = 120;

/** Each strand is a pure function of (place, index), so it never jumps when you switch tabs or tap −1. */
function strand(loc: Loc, i: number) {
  const seed = loc.split("").reduce((s, c) => s * 31 + c.charCodeAt(0), 7) + i * 7919;
  const r = rng(seed);
  const len = 46 + r() * 56;
  const bend = (r() - 0.5) * 70;
  return {
    d: `M ${-len / 2} 0 C ${-len / 5} ${bend} ${len / 5} ${-bend} ${len / 2} ${bend * 0.35}`,
    transform: `translate(${14 + r() * 172} ${14 + r() * 172}) rotate(${r() * 360})`,
    width: 0.7 + r() * 0.7,
  };
}

interface HairCounterProps {
  value: HairCount;
  onChange: (next: HairCount) => void;
  /** Called with the final count (so callers never read stale state). */
  onDone: (count: HairCount) => void;
  /** "check" is the full-page ritual; "drawer" is the compact one inside the tracker. */
  variant?: "check" | "drawer";
}

export function HairCounter({ value, onChange, onDone, variant = "check" }: HairCounterProps) {
  const [loc, setLoc] = useState<Loc>("pillow");
  const [fresh, setFresh] = useState<string | null>(null);
  const total = totalCount(value);
  const here = value[loc];

  const add = (n: number) => {
    const next = Math.min(MAX_PER_PLACE, here + n);
    if (next === here) return;
    onChange({ ...value, [loc]: next });
    setFresh(`${loc}-${next - 1}`);
    navigator.vibrate?.(8);
  };
  const remove = () => {
    if (here === 0) return;
    onChange({ ...value, [loc]: here - 1 });
    setFresh(null);
  };

  const first = Math.max(0, here - MAX_STRANDS);
  const strands = Array.from({ length: here - first }, (_, k) => first + k);
  const marker = Math.min(total, 200) / 2; // 0–200 mapped to 0–100%

  return (
    <div>
      {variant === "check" && (
        <header className="animate-fade-up">
          <h1 className="font-display text-[28px] leading-[1.1] tracking-[-0.01em]">
            Count tonight's <em className="italic text-lamp">hairs.</em>
          </h1>
          <p className="mt-2 text-[13px] leading-snug text-ink-muted">
            Check your pillow, your comb or brush, the shower drain, and anywhere else (clothes, floor). Tap once per
            hair.
          </p>
        </header>
      )}

      <div
        role="tablist"
        aria-label="Where you found them"
        className={cn("grid grid-cols-4 gap-1 rounded-2xl border border-line bg-surface p-1", variant === "check" && "mt-4")}
      >
        {LOCATIONS.map((l) => {
          const on = l.id === loc;
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setLoc(l.id);
                setFresh(null);
              }}
              className={cn(
                "flex min-h-[56px] touch-manipulation flex-col items-center justify-center rounded-xl px-1 transition-colors duration-150",
                on ? "bg-lamp text-on-lamp" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <span className="text-[12px] font-medium leading-none">{l.label}</span>
              <span className="num mt-1.5 font-display text-xl leading-none">{value[l.id]}</span>
            </button>
          );
        })}
      </div>

      {/* The running total sits right under the tabs, so it stays in view while you tap the pad. */}
      <div className="mt-3 flex items-center gap-4">
        <div aria-live="polite" aria-atomic="true" className="shrink-0">
          <span key={total} className="num block animate-bump font-display text-[56px] leading-none tracking-tight">
            {total}
          </span>
          <span className="mt-1 block whitespace-nowrap text-[12px] leading-none text-ink-muted">
            {total === 1 ? "hair" : "hairs"} counted so far
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div aria-hidden="true">
            <div className="relative h-3 rounded-full bg-surface-2">
              <div className="absolute inset-y-0 left-1/4 w-1/4 rounded-full bg-normal/25" />
              <div
                className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-bg bg-lamp shadow transition-[left] duration-300 ease-out"
                style={{ left: `${marker}%` }}
              />
            </div>
            <div className="relative mt-1 h-3.5 text-[11px] leading-none text-ink-faint">
              <span className="absolute left-0">0</span>
              <span className="absolute left-1/4 -translate-x-1/2">50</span>
              <span className="absolute left-1/2 -translate-x-1/2">100</span>
              <span className="absolute right-0">200+</span>
            </div>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-ink-muted">Dermatologists: 50–100 a day is normal.</p>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <div className="rounded-full border border-dashed border-line p-2">
          <button
            type="button"
            onClick={() => add(1)}
            aria-label={`Add one hair to ${LOCATIONS.find((l) => l.id === loc)!.label}. ${here} so far.`}
            className={cn(
              "relative block size-[min(64vw,260px)] touch-manipulation select-none overflow-hidden rounded-full border border-line bg-surface",
              "shadow-[inset_0_0_48px_rgb(var(--lamp)/0.07)] transition-transform duration-100 active:scale-[0.965]",
            )}
          >
            <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 size-full">
              {strands.map((i) => {
                const s = strand(loc, i);
                const isFresh = fresh === `${loc}-${i}`;
                return (
                  <path
                    key={`${loc}-${i}`}
                    d={s.d}
                    transform={s.transform}
                    pathLength={1}
                    fill="none"
                    strokeLinecap="round"
                    strokeWidth={s.width}
                    className={cn("stroke-ink/60", isFresh && "animate-strand")}
                  />
                );
              })}
            </svg>
            {here === 0 && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-ink-muted">
                <span className="font-display text-2xl italic">tap per hair</span>
                <span className="text-xs">{LOCATIONS.find((l) => l.id === loc)!.label.toLowerCase()}</span>
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" onClick={remove} disabled={here === 0} className={btn("secondary", "min-w-[84px]")} aria-label="Remove one hair">
          −1
        </button>
        <button type="button" onClick={() => add(5)} className={btn("secondary", "min-w-[84px]")} aria-label="Add five hairs">
          +5
        </button>
      </div>

      <div className={cn("flex flex-col items-center gap-1", variant === "check" ? "mt-5" : "mt-4")}>
        <button type="button" disabled={total === 0} onClick={() => onDone(value)} className={btn("primary", "w-full")}>
          {variant === "check" ? "That's everything →" : "Use this count →"}
        </button>

        {variant === "check" && total === 0 && (
          <button type="button" onClick={() => onDone(NO_HAIRS)} className={btn("ghost")}>
            I found none
          </button>
        )}

        {variant === "check" && (
          <p className="mt-1 text-center text-[14px] text-ink-muted">
            Not near a drain right now?{" "}
            <button
              type="button"
              onClick={() => {
                onChange(EXAMPLE);
                setFresh(null);
                toast("Example count loaded. Do the real one tonight.");
              }}
              className="inline-flex min-h-11 items-center font-medium text-lamp underline decoration-lamp/40 underline-offset-4"
            >
              Use an example count
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
