import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { LifeBuoy, RotateCcw, Share2, Stethoscope } from "lucide-react";
import { VERDICT_COPY, type HairCount, type Result, type Verdict } from "@/content";
import { DoctorNote } from "@/components/DoctorNote";
import { RedFlags } from "@/components/RedFlags";
import { Section } from "@/components/Section";
import { Donts, TonightSteps } from "@/components/TonightSteps";
import { VerdictCard } from "@/components/VerdictCard";
import { useDesktop } from "@/lib/media";
import { renderCard, shareResult, type ShareTarget } from "@/lib/share";
import { btn, stagger } from "@/lib/ui";
import { openUrgent } from "@/lib/urgent";

/** Chip look shared by the "dig deeper" rows on both result screens. */
export const CHIP =
  "inline-flex min-h-11 touch-manipulation items-center rounded-full border border-line bg-surface px-4 text-[14px] text-ink transition duration-150 hover:border-lamp/60 hover:bg-surface-2 active:scale-[0.98]";

function ShareBlock({ worry, verdict, compact = false }: { worry: ShareTarget; verdict: Verdict; compact?: boolean }) {
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

  const button = (
    <button type="button" onClick={share} disabled={busy} className={btn(compact ? "secondary" : "primary", "w-full")}>
      <Share2 className="size-4" aria-hidden="true" />
      {busy ? "Getting the card ready…" : compact ? "Send it to someone worrying too" : "Send it on"}
    </button>
  );

  if (compact) {
    return (
      <div>
        {button}
        <p className="mt-2 text-[13px] leading-snug text-ink-faint">
          The card has no numbers and nothing personal on it. Opens your share sheet, or WhatsApp.
        </p>
      </div>
    );
  }

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
          {button}
          <p className="mt-2.5 text-[13px] leading-snug text-ink-faint">Opens your share sheet, or WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}

interface ResultViewProps {
  result: Omit<Result, "sources">;
  /** Worry title: heads the doctor-ready summary. */
  title: string;
  at: number;
  /** "Tonight, don't" items. */
  donts: string[];
  share: ShareTarget;
  /** Hair only. */
  count?: HairCount;
  /** Marks the verdict card and the doctor summary as AI-written. */
  ai?: boolean;
  /** Laptop only: the main call to action above the share button (curated: the tracker). */
  asideAction?: ReactNode;
  /** The "dig a little deeper" section. */
  deeper: ReactNode;
  /** The feedback widget. */
  feedback: ReactNode;
  /** The "Why should I trust this?" section. */
  trust: ReactNode;
  checkAgainHref: string;
  /** A WipeButton for this result. */
  wipe: ReactNode;
}

/** The result screen's sections, in order. Curated and AI results both render through this, so they can't drift apart. */
export function ResultView({
  result,
  title,
  at,
  donts,
  share,
  count,
  ai = false,
  asideAction,
  deeper,
  feedback,
  trust,
  checkAgainHref,
  wipe,
}: ResultViewProps) {
  const desktop = useDesktop();

  const eyebrow = (
    <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.09em] text-lamp">Here's the honest answer.</p>
  );

  const verdict = <VerdictCard result={result} count={count} ai={ai} />;

  const whoToSee = result.whoToSee ? (
    <p className="flex items-start gap-3 rounded-2xl bg-surface-2 px-4 py-3.5 text-[16px] leading-snug text-ink">
      <Stethoscope className="mt-0.5 size-5 shrink-0 text-lamp" aria-hidden="true" />
      <span>
        Who to see: <b className="font-semibold">{result.whoToSee}</b>
      </span>
    </p>
  ) : null;

  const explainer = (
    <Section title="What might be going on">
      <div className="space-y-3.5 text-[17px] leading-relaxed text-ink">
        {result.explainer.map((p, k) => (
          <p key={k}>{p}</p>
        ))}
      </div>
    </Section>
  );

  const tonight = (
    <Section title="What to do tonight">
      <TonightSteps tryTonight={result.tryTonight} verdict={result.verdict} />
    </Section>
  );

  const dontSection = (
    <Section title="Tonight, don't">
      <Donts items={donts} />
    </Section>
  );

  const flags = (
    <Section title="When to get help">
      <RedFlags flags={result.redFlags} />
      <button
        type="button"
        onClick={openUrgent}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl text-[15px] font-medium text-doctor underline decoration-doctor/40 underline-offset-4 transition-colors hover:decoration-doctor"
      >
        <LifeBuoy className="size-4" aria-hidden="true" />
        See the urgent-help signs
      </button>
    </Section>
  );

  const doctor = <DoctorNote title={title} result={result} at={at} ai={ai} defaultOpen={result.verdict === "doctor"} />;

  const feedbackSection = <Section>{feedback}</Section>;

  const bottomRow = (
    <div className="-ml-1 flex flex-wrap items-center justify-between gap-x-4 border-t border-line pt-3">
      <a href={checkAgainHref} className={btn("ghost", "gap-1.5 no-underline")}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Check again
      </a>
      {wipe}
    </div>
  );

  const stack = (items: ReactNode[]) =>
    items.filter(Boolean).map((node, i) => (
      <div key={i} className="animate-fade-up" style={stagger(i, 60)}>
        {node}
      </div>
    ));

  if (desktop) {
    return (
      <div className="grid grid-cols-12 items-start gap-x-14">
        <aside className="sticky top-24 col-span-5 space-y-4">
          {stack([
            <>
              {eyebrow}
              {verdict}
            </>,
            whoToSee,
            <div className="space-y-3">
              {asideAction}
              <ShareBlock worry={share} verdict={result.verdict} compact />
            </div>,
            <div className="-ml-1 flex flex-wrap items-center justify-between gap-x-4">
              <a href={checkAgainHref} className={btn("ghost", "gap-1.5 no-underline")}>
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Check again
              </a>
              {wipe}
            </div>,
          ])}
        </aside>

        <div className="col-span-7 space-y-9 pt-9">
          {stack([explainer, tonight, dontSection, flags, doctor, deeper, feedbackSection, trust])}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-9">
      {stack([
        <>
          {eyebrow}
          {verdict}
        </>,
        explainer,
        tonight,
        dontSection,
        flags,
        whoToSee,
        doctor,
        deeper,
        feedbackSection,
        <Section title="Send to someone who's worrying about the same thing">
          <ShareBlock worry={share} verdict={result.verdict} />
        </Section>,
        trust,
        bottomRow,
      ])}
    </div>
  );
}
