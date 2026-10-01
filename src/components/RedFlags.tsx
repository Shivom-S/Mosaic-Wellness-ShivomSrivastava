import { Check } from "lucide-react";
import type { Result } from "@/content";
import { cn } from "@/lib/utils";

export function RedFlags({ flags }: { flags: Result["redFlags"] }) {
  const anyHit = flags.some((f) => f.hit);

  return (
    <div>
      <ul className="space-y-2">
        {flags.map((f) => (
          <li
            key={f.text}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-[15px] leading-snug",
              f.hit ? "border-doctor/40 bg-doctor/10 text-ink" : "border-line bg-surface text-ink-muted",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full border-2",
                f.hit ? "border-doctor bg-doctor text-bg" : "border-ink-faint/50",
              )}
            >
              {f.hit && <Check className="size-3.5" strokeWidth={3.5} />}
            </span>
            <span className="min-w-0 flex-1">
              {f.text}
              {f.hit && <span className="mt-1 block text-[13px] font-bold text-doctor">← you said this</span>}
            </span>
          </li>
        ))}
      </ul>
      {!anyHit && <p className="mt-3 text-[15px] text-ink-muted">None of these apply to you.</p>}
    </div>
  );
}
