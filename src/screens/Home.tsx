import { WORRIES } from "@/content";
import { ExampleStrip } from "@/components/ExampleStrip";
import { SayItBox } from "@/components/SayItBox";
import { WorryCard } from "@/components/WorryCard";
import { greeting, useNow } from "@/lib/clock";
import { loadEntries, useStoreVersion } from "@/lib/storage";
import { stagger } from "@/lib/ui";

export function Home() {
  const now = useNow();
  useStoreVersion(); // re-read tracker progress after a wipe
  const g = greeting(now);

  return (
    <div className="space-y-8">
      <section className="animate-fade-up pt-1">
        <p className="font-display leading-none">
          <span className="text-[18px] italic text-ink-muted">It's </span>
          <time dateTime={`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`}>
            <span className="num text-[58px] tracking-[-0.03em] text-ink">{g.time}</span>
            <span className="ml-1 text-[24px] italic text-lamp">{g.meridiem}</span>
          </time>
          <span className="text-[24px] text-ink-muted">.</span>
        </p>
        <p className="mt-1.5 font-display text-[19px] italic leading-snug text-ink-muted">{g.line}</p>

        <h1 className="mt-5 font-display text-[31px] leading-[1.08] tracking-[-0.015em] text-ink">
          Honest answers to the <em className="italic text-lamp">health worries</em> you'd never say out loud.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
          Real thresholds from dermatologists, gynaecologists, sleep doctors and paediatricians. No sign-up. Nothing
          leaves your phone. Nothing to buy.
        </p>
      </section>

      <section aria-label="Pick a worry" className="space-y-3">
        {WORRIES.map((w, i) => (
          <WorryCard key={w.id} worry={w} entries={loadEntries(w.id)} style={stagger(i + 2, 80)} />
        ))}
      </section>

      <div className="animate-fade-up" style={stagger(7, 80)}>
        <SayItBox />
      </div>

      <div className="animate-fade-up" style={stagger(8, 80)}>
        <ExampleStrip />
      </div>
    </div>
  );
}
