import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Section } from "@/components/Section";
import { Sources } from "@/components/Sources";
import { href } from "@/lib/route";
import { btn, stagger } from "@/lib/ui";

const REPO = "https://github.com/Shivom-S/Mosaic-Wellness-ShivomSrivastava";

function Block({ title, i, children }: { title: string; i: number; children: ReactNode }) {
  return (
    <Section title={title} style={stagger(i)}>
      <div className="space-y-3.5 text-[16px] leading-relaxed text-ink">{children}</div>
    </Section>
  );
}

const Em = ({ children }: { children: ReactNode }) => <em className="italic text-ink">{children}</em>;

export function About() {
  return (
    <div className="space-y-10">
      <div className="animate-fade-up">
        <a
          href={href({ name: "home" })}
          aria-label="Back to home"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </a>
        <h1 className="mt-2 font-display text-[38px] leading-[1.06] tracking-[-0.015em]">
          Why <em className="italic text-lamp">1AM</em> exists
        </h1>
      </div>

      <section className="animate-fade-up space-y-3.5 text-[17px] leading-relaxed text-ink" style={stagger(1)}>
        <p>
          People don't wake up wanting a wellness app. They show up at 1 AM with a private worry: hair in the drain, a
          late period, a toddler who won't eat. They type it into a search bar they'd never say out loud to a person.
          What they get back is a wall of forums, worst cases and ads.
        </p>
        <p>
          Mosaic's own line is that health is a <Em>pull</Em> business, not a push one. The pull happens in that moment
          of worry. Whoever answers it honestly earns the trust that every long relationship afterwards is built on.
        </p>
      </section>

      <Block title="What it does" i={2}>
        <p>
          Four worries, each answered in about 60 seconds against the thresholds specialists actually use, with the
          source shown on every answer. A verdict in plain words: <Em>normal</Em>, <Em>keep an eye on it</Em>, or{" "}
          <Em>worth a doctor visit</Em>. One thing to try tonight. A doctor-ready summary if you need one. And if one
          data point isn't enough, an optional 14-day tracker that turns a 1 AM guess into a trend.
        </p>
      </Block>

      <Section title="The decisions" style={stagger(3)}>
        <ul className="space-y-3 text-[16px] leading-relaxed text-ink">
          {[
            [
              "Honest over helpful-sounding.",
              "Brand quizzes end in a cart. 1AM often ends in “you're fine, don't buy anything”. That's deliberate: trust before transaction.",
            ],
            [
              "Rules, not a chatbot.",
              "Every verdict is deterministic and traceable to a cited threshold. It never makes up a statistic, never breaks without an API key, and the same answers always give the same verdict.",
            ],
            [
              "Four worries, done properly.",
              "Breadth is easy to add once the engine and the tone work.",
            ],
            [
              "Private by design.",
              "No account, no analytics, nothing sent anywhere. Phones get shared, so there's a one-tap wipe.",
            ],
            [
              "Cut on purpose:",
              "a symptom-checker “AI doctor”, streaks and gamification, product recommendations, and an operator dashboard built on synthetic data. (Made-up statistics have no place in a trust product.)",
            ],
          ].map(([lead, rest]) => (
            <li key={lead} className="flex gap-3.5">
              <span aria-hidden="true" className="mt-[0.62em] size-1.5 shrink-0 rounded-full bg-lamp" />
              <span>
                <Em>{lead}</Em> {rest}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Block title="What I'd measure" i={4}>
        <p>
          Not DAU. The leading indicators for a product like this are: <b className="font-semibold">worry-resolved rate</b>{" "}
          (did the person leave calmer, or with a clear next step?), <b className="font-semibold">day-7 return among people who started tracking</b>,
          and <b className="font-semibold">doctor-visit follow-through</b> for “worth a doctor visit” verdicts.
        </p>
      </Block>

      <Block title="What the questions would tell a business" i={5}>
        <p>
          Every worry typed into the “say it your way” box is a demand signal: what people are anxious about, in their
          own words, before they're anyone's customer. Aggregated and anonymised, with consent, that's an early-warning
          system for categories. It's the only dashboard I'd want to build next, and only on real data.
        </p>
      </Block>

      <Block title="How AI helped" i={6}>
        <p>
          I used Claude in two ways. First, as a <Em>council</Em>: five AI advisors with deliberately different lenses
          (contrarian, first-principles, expansionist, outsider, executor) debated what to build, then anonymously
          reviewed each other. That council's most popular “big idea”, an operator dashboard, was the one I cut.
          Second, as a <Em>builder</Em>: Claude Code wrote the interface from my spec, while every threshold and every
          line of medical copy was checked against the sources listed below.
        </p>
      </Block>

      <Section title="Sources" style={stagger(7)}>
        <Sources grouped collapsible={false} />
      </Section>

      <Section style={stagger(8)}>
        <div className="rounded-[28px] border border-line bg-surface p-5">
          <p className="text-[13px] font-bold uppercase tracking-[0.09em] text-lamp">Built by</p>
          <p className="mt-2 font-display text-[24px] leading-tight">Shivom Srivastava</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">
            Economics &amp; Finance, Ashoka University. For the Mosaic Wellness CEO's Office Builder Round.
          </p>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className={btn("secondary", "mt-4 w-full")}
          >
            See the code on GitHub
            <ExternalLink className="size-4" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        <a href={href({ name: "home" })} className={btn("primary", "mt-4 w-full")}>
          Try it →
        </a>
      </Section>
    </div>
  );
}
