import { useEffect, useMemo, useState } from "react";
import { WORRIES } from "@/content";
import { checksStatus } from "@/lib/api";
import { Disclosure } from "@/components/Disclosure";
import { Feedback } from "@/components/Feedback";
import { CHIP, ResultView } from "@/components/ResultView";
import { WipeButton } from "@/components/WipeButton";
import { href, replaceRoute } from "@/lib/route";
import { keys, loadAiHistory, loadAiLast, loadAiPending, session, store } from "@/lib/storage";
import { openUrgent } from "@/lib/urgent";

const startOver = () => {
  session.remove(keys.aiCheck);
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
  const home = href({ name: "home" });

  const trust = (
    <Disclosure title="Why should I trust this?" summary="Written by an AI, with no cited sources">
      <p className="text-body text-ink-muted">
        This answer was written by an AI model ({model}) from your answers, using the same structure as our reviewed
        checks. It has no cited sources, so treat it as a starting point and check anything important with a doctor.
      </p>
      <p className="mb-2.5 mt-4 text-body font-semibold text-ink">Prefer an answer with sources? Try a reviewed check:</p>
      <ul className="flex flex-wrap gap-2">
        {WORRIES.map((w) => (
          <li key={w.id}>
            <a href={href({ name: "check", id: w.id })} className={CHIP}>
              {w.title}
            </a>
          </li>
        ))}
      </ul>
    </Disclosure>
  );

  return (
    <ResultView
      result={result}
      title={check.title}
      at={at}
      donts={result.dont}
      share={{ id: "ai", title: check.title, whisper: check.whisper || saved.text }}
      ai
      next={{ label: "Check something else", href: home }}
      feedback={<Feedback worryId="ai" verdict={result.verdict} />}
      trust={trust}
      checkElse={{ href: home, onClick: startOver }}
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
