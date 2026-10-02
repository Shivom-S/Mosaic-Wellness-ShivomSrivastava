import { useEffect, useMemo, useState } from "react";
import { DONTS, WORRY, type WorryId } from "@/content";
import { Feedback } from "@/components/Feedback";
import { CHIP, ResultView } from "@/components/ResultView";
import { Section } from "@/components/Section";
import { Sources } from "@/components/Sources";
import { WipeButton } from "@/components/WipeButton";
import { href, replaceRoute } from "@/lib/route";
import { keys, loadLast } from "@/lib/storage";
import { btn } from "@/lib/ui";

export function Result({ id }: { id: WorryId }) {
  const worry = WORRY[id];
  const saved = useMemo(() => loadLast(id), [id]);
  const [trustOpen, setTrustOpen] = useState(false);

  useEffect(() => {
    if (!saved) replaceRoute({ name: "check", id });
  }, [saved, id]);

  if (!saved) return null;
  const { result, count, at } = saved;
  const tracker = worry.tracker;

  const trackLabel =
    tracker.kind === "dates" ? "Log your period dates" : `Track it for ${tracker.days} ${tracker.unitLabel}s`;
  const exampleLabel =
    tracker.kind === "dates" ? "See what a few cycles look like" : `See what ${tracker.days} ${tracker.unitLabel}s looks like`;

  const showTrust = () => {
    setTrustOpen(true);
    requestAnimationFrame(() =>
      document.getElementById("trust")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      }),
    );
  };

  const deeper = (
    <Section title="Want to dig a little deeper?">
      <div className="flex flex-wrap gap-2">
        <a href={href({ name: "track", id })} className={CHIP}>
          {trackLabel}
        </a>
        <a href={href({ name: "example", id })} className={CHIP}>
          {exampleLabel}
        </a>
        <a href={href({ name: "home" })} className={CHIP}>
          Check a different worry
        </a>
        <button type="button" onClick={showTrust} className={CHIP}>
          Why should I trust this?
        </button>
      </div>
    </Section>
  );

  const trust = (
    <section id="trust" className="scroll-mt-6">
      <Section title="Why should I trust this?">
        <p className="-mt-1 mb-2 text-[14px] leading-relaxed text-ink-muted">
          Every number here comes from a published source. Have a look.
        </p>
        <Sources ids={result.sources} open={trustOpen} onOpenChange={setTrustOpen} />
      </Section>
    </section>
  );

  return (
    <ResultView
      result={result}
      title={worry.title}
      at={at}
      donts={DONTS[id]}
      share={worry}
      count={count}
      asideAction={
        <a href={href({ name: "track", id })} className={btn(result.suggestTracking ? "primary" : "secondary", "w-full")}>
          {trackLabel} →
        </a>
      }
      deeper={deeper}
      feedback={<Feedback worryId={id} verdict={result.verdict} />}
      trust={trust}
      checkAgainHref={href({ name: "check", id })}
      wipe={
        <WipeButton
          scope={[keys.last(id), keys.feedback(id)]}
          label="Wipe this from my phone"
          question="Wipe this check?"
          detail="Your answers and this result will be deleted from this phone. They were never anywhere else."
          onWiped={() => replaceRoute({ name: "home" })}
        />
      }
    />
  );
}
