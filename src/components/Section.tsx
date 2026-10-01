import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** A screen section: enters with the stagger, optional editorial heading. */
export function Section({ title, children, className, style }: SectionProps) {
  return (
    <section className={cn("animate-fade-up", className)} style={style}>
      {title && <h2 className="mb-3 font-display text-[22px] leading-snug text-ink">{title}</h2>}
      {children}
    </section>
  );
}
