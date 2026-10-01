import { ArrowRight } from "lucide-react";
import type { DailyEntry, Worry } from "@/content";
import { href } from "@/lib/route";
import { trackStatus } from "@/lib/track";
import { plural } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface WorryCardProps {
  worry: Worry;
  entries: DailyEntry[];
  style?: CSSProperties;
  className?: string;
  /** Spans both laptop columns, so an odd last card leaves no gap. */
  wide?: boolean;
}

export function WorryCard({ worry, entries, style, className, wide }: WorryCardProps) {
  const status = trackStatus(worry, entries);
  const tracker = worry.tracker;

  let pill: string | null = null;
  if (status.logged > 0) {
    if (tracker.kind === "dates") pill = `${plural(status.logged, "date")} logged · add another`;
    else if (status.loggedToday) pill = `Day ${status.logged} of ${tracker.days} · logged today`;
    else pill = `Day ${status.day} of ${tracker.days} · log today`;
  }

  return (
    <article
      style={style}
      className={cn(
        "group relative animate-fade-up rounded-[28px] border border-line bg-surface px-5 py-4 transition duration-200 hover:border-lamp/50 hover:bg-surface-2 active:scale-[0.99] lg:flex lg:flex-col lg:py-5 lg:hover:-translate-y-0.5",
        wide && "lg:col-span-2",
        className,
      )}
    >
      <a
        href={href({ name: "check", id: worry.id })}
        className="block rounded-[20px] after:absolute after:inset-0 after:rounded-[28px] after:content-['']"
      >
        <p className={cn("pr-12 font-display text-[26px] italic leading-[1.12] tracking-[-0.01em] text-ink lg:text-[23px]", !wide && "lg:min-h-[5.1rem]")}>
          “{worry.whisper}”
        </p>
        <h2 className="mt-2 text-[12px] font-bold uppercase tracking-[0.09em] text-lamp">{worry.title}</h2>
        <p className="mt-1 max-w-[34ch] text-[14px] leading-snug text-ink-muted">{worry.blurb}</p>
      </a>

      {pill && (
        <a
          href={href({ name: "track", id: worry.id })}
          className="relative z-10 mt-3 inline-flex items-center rounded-full border border-lamp/40 bg-lamp/15 px-3.5 py-2 text-[13px] font-semibold text-lamp before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-['']"
        >
          {pill}
        </a>
      )}

      <span
        aria-hidden="true"
        className="absolute right-4 top-3.5 flex size-10 items-center justify-center rounded-full border border-line text-ink-muted transition-all duration-200 group-hover:border-lamp group-hover:bg-lamp group-hover:text-on-lamp"
      >
        <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}
