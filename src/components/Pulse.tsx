import { useEffect, useState } from "react";
import { WORRY, type WorryId } from "@/content";
import { apiEnabled, getPulse, type Pulse as P } from "@/lib/api";

/** Live, anonymous aggregate from the backend. Renders nothing if the API is off or empty. */
export function Pulse({ className = "" }: { className?: string }) {
  const [pulse, setPulse] = useState<P | null>(null);
  useEffect(() => {
    if (apiEnabled) getPulse().then(setPulse);
  }, []);
  if (!pulse || pulse.total < 1) return null;

  const top = (Object.entries(pulse.byWorry) as [WorryId, number][]).sort((a, b) => b[1] - a[1])[0];
  const max = Math.max(1, ...Object.values(pulse.byWorry));

  return (
    <section className={`rounded-[28px] border border-line bg-surface p-5 ${className}`} aria-label="1AM pulse">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-lamp">Live · last {pulse.windowDays} days</p>
      <h2 className="mt-1.5 font-display text-[20px] leading-snug">
        {pulse.total} answer{pulse.total === 1 ? "" : "s"} rated
        {pulse.helpedPct !== null && (
          <>
            {" "}· <span className="text-lamp">{pulse.helpedPct}%</span> said it helped
          </>
        )}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {(Object.keys(pulse.byWorry) as WorryId[]).map((id) => (
          <li key={id} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-[13px]">
            <span className="truncate text-ink-muted">{WORRY[id].title}</span>
            <span className="h-2 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full bg-lamp/80" style={{ width: `${(pulse.byWorry[id] / max) * 100}%` }} />
            </span>
            <span className="num text-right text-ink-muted">{pulse.byWorry[id]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3.5 text-[12px] leading-snug text-ink-muted">
        Most on people's minds: <span className="text-ink">{WORRY[top[0]].title}</span>. Built from anonymous ratings only:
        worry type, verdict type and "did it help". No answers, no counts, no ids.
      </p>
    </section>
  );
}
