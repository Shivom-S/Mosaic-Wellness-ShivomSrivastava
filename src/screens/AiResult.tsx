import { useEffect, useMemo, useState } from "react";
import { WORRIES } from "@/content";
import { checksStatus } from "@/lib/api";
import { Feedback } from "@/components/Feedback";
import { CHIP, ResultView } from "@/components/ResultView";
import { Section } from "@/components/Section";
import { WipeButton } from "@/components/WipeButton";
import { href, replaceRoute } from "@/lib/route";
import { keys, loadAiHistory, loadAiLast, loadAiPending, session, store } from "@/lib/storage";
import { openUrgent } from "@/lib/urgent";

const startOver = () => {
  session.remove(keys.aiCheck);
  window.location.hash = href({ name: "home" });
  // Home mounts on the next tick; hand the cursor to the box so the person can just type.
  window.setTimeout(() => document.getElementById("say-it")?.focus(), 150);
};

/** The result of an AI-built check. Same sections as a reviewed check's result, labelled as AI-written. */
export function AiResult() {
  const saved = useMemo(() => loadAiLast(), []);
  const [model, setModel] = useState("Gemini");

  useEffect(() => {
    if (!saved) replaceRoute(loadAiPending() ? { name: "ai-check" } : { name: "home" });
    else if (saved.urgent) openUrgent();
  }, [saved]);

  // Name the model the backend really uses. Gemini is the fallback wording.
  useEffect(() => {
    let live = true;
    void checksStatus().then((c) => live && c && setModel(c === "claude" ? "Claude" : "Gemini"));
    return () => {
      live = false;
    };
  }, []);

  if (!saved) return null;
  const { result, check, at } = saved;

  const showTrust = () => {
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
        <button type="button" onClick={startOver} className={CHIP}>
          Start over with different words
        </button>
        <a href={href({ name: "home" })} className={CHIP}>
          See our reviewed checks
        </a>
        <button type="button" onClick={showTrust} className={CHIP}>
          Why should I trust this?
        </button>
      </div>
    </Section>
  );

  // Not collapsed: the plain statement is the point of this section.
  const trust = (
    <section id="trust" className="scroll-mt-6">
      <Section title="Why should I trust this?">
        <p className="text-[15px] leading-relaxed text-ink-muted">
          This answer was written by an AI model ({model}) from your answers, using the same structure as our reviewed
          checks. It has no cited sources, so treat it as a starting point and check anything important with a doctor.
        </p>
        <p className="mb-2.5 mt-4 text-[14px] font-semibold text-ink">Prefer an answer with sources? Our seven reviewed checks:</p>
        <ul className="flex flex-wrap gap-2">
          {WORRIES.map((w) => (
            <li key={w.id}>
              <a href={href({ name: "check", id: w.id })} className={CHIP}>
                {w.title}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </section>
  );

  return (
    <ResultView
      result={result}
      title={check.title}
      at={at}
      donts={result.dont}
      share={{ id: "ai", title: check.title, whisper: check.whisper || saved.text }}
      ai
      deeper={deeper}
      feedback={<Feedback worryId="ai" verdict={result.verdict} />}
      trust={trust}
      checkAgainHref={href({ name: "home" })}
      wipe={
        <WipeButton
          scope={[keys.aiLast, keys.feedback("ai")]}
          label="Wipe this from my phone"
          question="Wipe this check?"
          detail="Your words, answers and this result will be deleted from this phone. 1AM never kept a copy."
          onWiped={() => {
            store.set(
              keys.aiHistory,
              loadAiHistory().filter((e) => e.at !== at),
            );
            replaceRoute({ name: "home" });
          }}
        />
      }
    />
  );
}
