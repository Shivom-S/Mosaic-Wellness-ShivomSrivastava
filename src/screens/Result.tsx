import { useEffect, useMemo } from "react";
import { DONTS, WORRY, type WorryId } from "@/content";
import { Disclosure } from "@/components/Disclosure";
import { Feedback } from "@/components/Feedback";
import { CHIP, ResultView } from "@/components/ResultView";
import { Sources } from "@/components/Sources";
import { WipeButton } from "@/components/WipeButton";
import { href, replaceRoute } from "@/lib/route";
import { keys, loadLast } from "@/lib/storage";
import { btn } from "@/lib/ui";

export function Result({ id }: { id: WorryId }) {
  const worry = WORRY[id];
  const saved = useMemo(() => loadLast(id), [id]);

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
  const trackHref = href({ name: "track", id });
  const exampleHref = href({ name: "example", id });

  const trust = (
    <Disclosure title="Why should I trust this?" summary="Every number comes from a published source">
      <Sources ids={result.sources} />
    </Disclosure>
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
        <div className="space-y-2">
          <a href={trackHref} className={btn(result.suggestTracking ? "primary" : "secondary", "w-full")}>
            {trackLabel} →
          </a>
          <a href={exampleHref} className={btn("ghost", "w-full no-underline")}>
            {exampleLabel}
          </a>
        </div>
      }
      next={{ label: "Track it", href: trackHref }}
      more={
        <a href={exampleHref} className={CHIP}>
          {exampleLabel}
        </a>
      }
      feedback={<Feedback worryId={id} verdict={result.verdict} />}
      trust={trust}
      checkElse={{ href: href({ name: "home" }) }}
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
