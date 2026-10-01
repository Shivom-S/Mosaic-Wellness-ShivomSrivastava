import { useEffect, useRef, useState } from "react";
import { WORRIES, type WorryId } from "@/content";
import { ExampleStrip } from "@/components/ExampleStrip";
import { History, HowItWorks, Popular, StopTheSpiral } from "@/components/HomeSections";
import { Pulse } from "@/components/Pulse";
import { SayItBox } from "@/components/SayItBox";
import { WorryCard } from "@/components/WorryCard";
import { aiStatus } from "@/lib/api";
import { greeting, useNow } from "@/lib/clock";
import { href } from "@/lib/route";
import { loadEntries, useStoreVersion } from "@/lib/storage";
import { stagger } from "@/lib/ui";

export function Home() {
  const now = useNow();
  useStoreVersion(); // re-read tracker progress after a wipe
  const g = greeting(now);
  const [ask, setAsk] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const [request, setRequest] = useState<{ text: string; n: number } | null>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // A popular question fills the box (so it feels heard) and then goes straight to the check.
  // With an AI connected, the chip is submitted like typed text so the check opens pre-filled.
  const pick = (q: string, worry: WorryId) => {
    setAsk(q);
    window.clearTimeout(timer.current);
    void aiStatus().then((ai) => {
      if (ai) return setRequest((r) => ({ text: q, n: (r?.n ?? 0) + 1 }));
      timer.current = window.setTimeout(() => {
        window.location.hash = href({ name: "check", id: worry });
      }, 320);
    });
  };

  return (
    <div className="space-y-10 lg:space-y-16">
      <div className="space-y-9 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-14 lg:space-y-0">
        <section className="animate-fade-up space-y-6 pt-1 lg:sticky lg:top-24 lg:col-span-5 lg:pt-6">
          <div>
            <p className="text-[14px] leading-snug text-ink-muted">
              It's actually{" "}
              <time
                dateTime={`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`}
                className="num font-semibold text-ink"
              >
                {g.time} {g.meridiem}
              </time>
              . <span className="italic">{g.line}</span>
            </p>

            <h1 className="mt-4 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink lg:text-[56px]">
              It's <em className="italic text-lamp">1 AM</em>. What's worrying you?
            </h1>
            <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-ink-muted lg:text-[17px]">
              Honest, plain-language answers to the health questions you don't know who else to ask.
            </p>
          </div>

          <SayItBox value={ask} onValue={setAsk} request={request} />

          <p className="text-[13px] leading-relaxed text-ink-muted">
            Cited sources · Nothing to buy · No account · Not a diagnosis
          </p>
        </section>

        <div className="space-y-9 lg:col-span-7 lg:space-y-12 lg:pt-6">
          <section aria-label="Pick a worry" className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {WORRIES.map((w, i) => (
              <WorryCard key={w.id} worry={w} entries={loadEntries(w.id)} style={stagger(i + 2, 80)} />
            ))}
          </section>

          <div className="animate-fade-up" style={stagger(6, 80)}>
            <Popular onPick={pick} />
          </div>

          <div className="animate-fade-up" style={stagger(7, 80)}>
            <ExampleStrip />
          </div>

          <div className="animate-fade-up" style={stagger(8, 80)}>
            <History />
            <Pulse />
          </div>
        </div>
      </div>

      <div className="animate-fade-up space-y-10 lg:space-y-14" style={stagger(9, 80)}>
        <StopTheSpiral />
        <HowItWorks />
      </div>
    </div>
  );
}
