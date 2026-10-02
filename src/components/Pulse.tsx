import { useEffect, useState } from "react";
import { apiEnabled, getPulse, type Pulse as P } from "@/lib/api";

/** Live, anonymous aggregate from the backend, as one line. Renders nothing if the API is off or empty. */
export function Pulse({ className = "" }: { className?: string }) {
  const [pulse, setPulse] = useState<P | null>(null);
  useEffect(() => {
    if (apiEnabled) getPulse().then(setPulse);
  }, []);
  if (!pulse || pulse.total < 1) return null;

  return (
    <p aria-label="1AM pulse" className={`text-small text-ink-muted ${className}`}>
      <span className="font-semibold text-ink">{pulse.total}</span> answer{pulse.total === 1 ? "" : "s"} rated in the last{" "}
      {pulse.windowDays} days.
      {pulse.helpedPct !== null && (
        <>
          {" "}
          <span className="font-semibold text-ink">{pulse.helpedPct}%</span> said it helped.
        </>
      )}
    </p>
  );
}
