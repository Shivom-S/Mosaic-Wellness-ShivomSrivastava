import { Check } from "lucide-react";
import type { Result } from "@/content";
import { cn } from "@/lib/utils";

/** A short checklist in one card. Any sign the person said yes to is filled in and says so in words. */
export function RedFlags({ flags }: { flags: Result["redFlags"] }) {
  const anyHit = flags.some((f) => f.hit);

  return (
    <div>
      <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-surface">
        {flags.map((f) => (
          <li
            key={f.text}
            className={cn("flex items-start gap-3 px-4 py-3 text-body", f.hit ? "bg-doctor/10 text-ink" : "text-ink-muted")}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-[0.2em] flex size-[22px] shrink-0 items-center justify-center rounded-full border-2",
                f.hit ? "border-doctor bg-doctor text-bg" : "border-ink-faint",
              )}
            >
              {f.hit && <Check className="size-3.5" strokeWidth={3.5} />}
            </span>
            <span className="min-w-0 flex-1">
              {f.text}
              {f.hit && <span className="mt-0.5 block text-small font-bold text-doctor">You said this</span>}
            </span>
          </li>
        ))}
      </ul>
      {!anyHit && <p className="mt-3 text-body text-ink-muted">None of these apply to you.</p>}
    </div>
  );
}
