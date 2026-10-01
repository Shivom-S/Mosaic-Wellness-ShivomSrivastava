import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Lamp, Share2, Stethoscope } from "lucide-react";
import { VERDICT_COPY, WORRY, type Verdict, type Worry, type WorryId } from "@/content";
import { DoctorNote } from "@/components/DoctorNote";
import { RedFlags } from "@/components/RedFlags";
import { Section } from "@/components/Section";
import { Sources } from "@/components/Sources";
import { VerdictCard } from "@/components/VerdictCard";
import { WipeButton } from "@/components/WipeButton";
import { href, replaceRoute } from "@/lib/route";
import { renderCard, shareResult } from "@/lib/share";
import { keys, loadLast } from "@/lib/storage";
import { btn, stagger } from "@/lib/ui";

function ShareBlock({ worry, verdict }: { worry: Worry; verdict: Verdict }) {
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Draw the card up front: it's what we show, and it makes the share sheet instant.
  useEffect(() => {
    let dead = false;
    let url: string | undefined;
    renderCard(worry, verdict)
      .then((blob) => {
        if (dead) return;
        url = URL.createObjectURL(blob);
        setCard({ blob, url });
      })
      .catch(() => undefined);
    return () => {
      dead = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [worry, verdict]);

  const share = async () => {
    setBusy(true);
    const outcome = await shareResult(worry, verdict, card?.blob);
    setBusy(false);
    if (outcome === "whatsapp") toast("Opening WhatsApp. The link is in the message.");
    else if (outcome === "copied") toast("Link copied. Paste it wherever they are.");
    else if (outcome === "failed") toast("Couldn't share from here. Copy the link from the address bar instead.");
  };

  return (
    <div>
      <p className="-mt-1 mb-4 text-[15px] leading-relaxed text-ink-muted">
        The card has no numbers and nothing personal on it. Just the worry and the verdict.
      </p>
      <div className="flex items-center gap-5">
        <div className="aspect-[4/5] w-[132px] shrink-0 -rotate-2 overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-lg">
          {card && (
            <img
              src={card.url}
              alt={`Share card: I checked at 1 AM. ${worry.title}. ${VERDICT_COPY[verdict].label}.`}
              className="size-full animate-fade-up object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={share} disabled={busy} className={btn("primary", "w-full")}>
            <Share2 className="size-4" aria-hidden="true" />
            {busy ? "One sec…" : "Send it on"}
          </button>
          <p className="mt-2.5 text-[13px] leading-snug text-ink-faint">Opens your share sheet, or WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}

export function Result({ id }: { id: WorryId }) {
  const worry = WORRY[id];
  const saved = useMemo(() => loadLast(id), [id]);

  useEffect(() => {
    if (!saved) replaceRoute({ name: "check", id });
  }, [saved, id]);

  if (!saved) return null;
  const { result, count, at } = saved;
  const tracker = worry.tracker;
  const trackTitle =
    tracker.kind === "dates"
      ? "Not sure? Log your period dates"
      : `Not sure? Track it for ${tracker.days} ${tracker.unitLabel}s`;
  const trackBody =
    tracker.kind === "dates"
      ? "Three start dates are enough to work out your real cycle length, and how much it moves."
      : "One 1 AM guess is a data point. A couple of weeks is a trend, and a trend is something a doctor can use.";

  let i = 1;

  return (
    <div className="space-y-9">
      <div className="animate-fade-up">
        <VerdictCard result={result} count={count} />
      </div>

      <Section title="What's probably going on" style={stagger(i++)}>
        <div className="space-y-3.5 text-[17px] leading-relaxed text-ink">
          {result.explainer.map((p, k) => (
            <p key={k}>{p}</p>
          ))}
        </div>
      </Section>

      <Section style={stagger(i++)}>
        <div className="rounded-[28px] border border-lamp/30 bg-lamp/10 p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-lamp text-on-lamp">
              <Lamp className="size-4" aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl text-ink">Try tonight</h2>
          </div>
          <p className="mt-3 text-[16px] leading-relaxed text-ink">{result.tryTonight}</p>
        </div>
      </Section>

      <Section title="See a doctor if any of these are true" style={stagger(i++)}>
        <RedFlags flags={result.redFlags} />
      </Section>

      {result.whoToSee && (
        <Section style={stagger(i++)}>
          <p className="flex items-start gap-3 rounded-2xl bg-surface-2 px-4 py-3.5 text-[16px] leading-snug text-ink">
            <Stethoscope className="mt-0.5 size-5 shrink-0 text-lamp" aria-hidden="true" />
            <span>
              Who to see: <b className="font-semibold">{result.whoToSee}</b>
            </span>
          </p>
        </Section>
      )}

      <Section style={stagger(i++)}>
        <DoctorNote worry={worry} result={result} at={at} defaultOpen={result.verdict === "doctor"} />
      </Section>

      <Section style={stagger(i++)}>
        <div className="rounded-[28px] border border-line bg-surface p-5">
          <h2 className="font-display text-[22px] leading-snug">{trackTitle}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{trackBody}</p>
          <div className="mt-4 flex flex-col items-start gap-1">
            <a
              href={href({ name: "track", id })}
              className={btn(result.suggestTracking ? "primary" : "secondary", "w-full")}
            >
              {tracker.kind === "dates" ? "Log my dates →" : "Start tracking →"}
            </a>
            <a href={href({ name: "example", id })} className={btn("ghost")}>
              See what {tracker.kind === "dates" ? "a few cycles look" : `${tracker.days} ${tracker.unitLabel}s look`} like
            </a>
          </div>
        </div>
      </Section>

      <Section title="Send to someone who's worrying about the same thing" style={stagger(i++)}>
        <ShareBlock worry={worry} verdict={result.verdict} />
      </Section>

      <Section title="Where these numbers come from" style={stagger(i++)}>
        <Sources ids={result.sources} defaultOpen />
      </Section>

      <Section style={stagger(i++)}>
        <div className="-ml-1 flex flex-wrap items-center justify-between gap-x-4 border-t border-line pt-3">
          <a href={href({ name: "check", id })} className={btn("ghost", "no-underline")}>
            ↺ Check again
          </a>
          <WipeButton
            scope={[keys.last(id)]}
            label="Wipe this from my phone"
            question="Wipe this check?"
            detail="Your answers and this result will be deleted from this phone. They were never anywhere else."
            onWiped={() => replaceRoute({ name: "home" })}
          />
        </div>
      </Section>
    </div>
  );
}
