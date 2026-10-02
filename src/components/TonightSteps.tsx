import { X } from "lucide-react";
import type { Verdict } from "@/content";

/** "What to do tonight": three numbered steps. The first is the worry's own advice. */
export function TonightSteps({ tryTonight, verdict }: { tryTonight: string; verdict: Verdict }) {
  const steps = [
    tryTonight,
    "Close the other tabs. You have what you need for tonight.",
    verdict === "doctor"
      ? "Book the appointment. Use the doctor-ready summary below."
      : "Check the warning signs below. If none apply, it can wait until morning.",
  ];
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-4 rounded-[22px] border border-line bg-surface px-4 py-4">
          <span className="num font-display text-[1.75rem] italic leading-none text-lamp">{String(i + 1).padStart(2, "0")}</span>
          <p className="min-w-0 flex-1 pt-0.5 text-body text-ink">{s}</p>
        </li>
      ))}
    </ol>
  );
}

/** "Tonight, don't": a quiet list with a small × marker. */
export function Donts({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((d) => (
        <li key={d} className="flex gap-3 text-body text-ink">
          <X aria-hidden="true" className="mt-[0.45em] size-4 shrink-0 text-ink-muted" strokeWidth={2.5} />
          <span>{d}</span>
        </li>
      ))}
    </ul>
  );
}
