import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Star {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  peak: number;
}

/** A few dozen 1–2px dots that breathe. Decorative, so hidden from assistive tech. */
export function StarField({ className, count = 44 }: { className?: string; count?: number }) {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() < 0.72 ? 1 : 2,
        delay: Math.random() * -6,
        duration: 3 + Math.random() * 4,
        peak: 0.5 + Math.random() * 0.5,
      })),
    [count],
  );

  return (
    <div aria-hidden="true" className={cn("starfield pointer-events-none fixed inset-0 overflow-hidden", className)}>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-ink"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.peak,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
