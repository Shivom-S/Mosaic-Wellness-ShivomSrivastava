import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Crescent } from "@/components/Logo";
import { History, HowItWorks, QuestionCells, TrustRow } from "@/components/HomeSections";
import { Pulse } from "@/components/Pulse";
import { SayItBox } from "@/components/SayItBox";
import { href } from "@/lib/route";
import { useStoreVersion } from "@/lib/storage";
import { stagger } from "@/lib/ui";

const focusSearch = () => document.getElementById("say-it")?.focus();

export function Home() {
  useStoreVersion(); // re-read saved checks after a wipe
  const [ask, setAsk] = useState("");

  return (
    <div className="mx-auto max-w-[920px] space-y-7 lg:space-y-9">
      <section className="animate-fade-up space-y-5">
        <div>
          <p className="flex items-center gap-2 text-small font-semibold uppercase tracking-[0.06em] text-lamp">
            <Crescent className="text-[1rem]" />
            1AM · honest health answers
          </p>
          <h1
            id="home-title"
            className="mt-2 text-balance font-display text-[2.375rem] leading-[1.1] tracking-[-0.02em] text-ink lg:text-[3.25rem]"
          >
            What's worrying you?
          </h1>
          <p className="mt-2 max-w-[44ch] text-body text-ink-muted">
            Ask in your own words. Get a plain answer and what to do next.
          </p>
        </div>
        <SayItBox value={ask} onValue={setAsk} labelledBy="home-title" />
      </section>

      <div className="animate-fade-up" style={stagger(2, 60)}>
        <QuestionCells onType={focusSearch} />
      </div>

      <div className="animate-fade-up space-y-6" style={stagger(3, 60)}>
        <HowItWorks />
        <TrustRow />
      </div>

      <div className="animate-fade-up space-y-4 border-t border-line pt-6" style={stagger(4, 60)}>
        <History />
        <a
          href={href({ name: "example", id: "hair" })}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl text-body font-semibold text-lamp underline-offset-4 hover:underline"
        >
          See what tracking looks like
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
        <Pulse />
      </div>
    </div>
  );
}
