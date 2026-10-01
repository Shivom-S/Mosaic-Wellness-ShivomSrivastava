import type { CSSProperties } from "react";
import { Check, Eye, Moon, Stethoscope, type LucideIcon } from "lucide-react";
import { VERDICT_COPY, type TrendResult, type Verdict } from "@/content";
import { cn } from "./utils";

/** Staggered entrance: spread across children via inline animation-delay. */
export const stagger = (i: number, step = 70): CSSProperties => ({ animationDelay: `${i * step}ms` });

type Variant = "primary" | "secondary" | "ghost" | "danger";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 touch-manipulation select-none whitespace-nowrap transition duration-150 disabled:pointer-events-none disabled:opacity-40";

const BTN: Record<Variant, string> = {
  primary:
    "min-h-[52px] rounded-full bg-lamp px-6 text-[15px] font-semibold text-on-lamp hover:brightness-110 active:scale-[0.98]",
  secondary:
    "min-h-[48px] rounded-full border border-line bg-surface px-5 text-[15px] font-medium text-ink hover:bg-surface-2 active:scale-[0.98]",
  ghost:
    "min-h-11 rounded-xl px-1 text-sm text-ink-muted underline decoration-line decoration-1 underline-offset-4 hover:text-ink",
  danger:
    "min-h-[48px] rounded-full border border-doctor/40 bg-doctor/10 px-5 text-[15px] font-medium text-doctor hover:bg-doctor/15 active:scale-[0.98]",
};

/** One button look for both <button> and <a>. */
export const btn = (variant: Variant = "primary", extra?: string) => cn(BTN_BASE, BTN[variant], extra);

export type ToneKey = Verdict | "early";

interface Tone {
  card: string;
  pill: string;
  text: string;
  soft: string;
  icon: LucideIcon;
  deco: LucideIcon;
}

/** Literal class names only, so Tailwind can see them. */
export const TONE: Record<ToneKey, Tone> = {
  normal: {
    card: "border-normal/30 bg-normal/10",
    pill: "bg-normal text-bg",
    text: "text-normal",
    soft: "bg-normal/15",
    icon: Check,
    deco: Moon,
  },
  watch: {
    card: "border-watch/30 bg-watch/10",
    pill: "bg-watch text-bg",
    text: "text-watch",
    soft: "bg-watch/15",
    icon: Eye,
    deco: Eye,
  },
  doctor: {
    card: "border-doctor/30 bg-doctor/10",
    pill: "bg-doctor text-bg",
    text: "text-doctor",
    soft: "bg-doctor/15",
    icon: Stethoscope,
    deco: Stethoscope,
  },
  early: {
    card: "border-line bg-surface",
    pill: "bg-surface-2 text-ink-muted",
    text: "text-ink-muted",
    soft: "bg-surface-2",
    icon: Moon,
    deco: Moon,
  },
};

/** Plain-words label for a verdict ("Still early" for a tracker with too little data). */
export const toneLabel = (k: ToneKey) => (k === "early" ? "Still early" : VERDICT_COPY[k].label);

export const DOT_TONE: Record<TrendResult["dots"][number], { fill: string; bar: string; label: string }> = {
  good: { fill: "bg-normal", bar: "fill-normal", label: "in range" },
  meh: { fill: "bg-watch", bar: "fill-watch", label: "a bit off" },
  bad: { fill: "bg-doctor", bar: "fill-doctor", label: "out of range" },
};

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
