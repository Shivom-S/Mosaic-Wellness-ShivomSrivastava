import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, LifeBuoy, Share2, Stethoscope } from "lucide-react";
import type { HairCount, Result, Verdict } from "@/content";
import { Disclosure } from "@/components/Disclosure";
import { DoctorNote } from "@/components/DoctorNote";
import { RedFlags } from "@/components/RedFlags";
import { Section } from "@/components/Section";
import { Donts, TonightSteps } from "@/components/TonightSteps";
import { VerdictCard } from "@/components/VerdictCard";
import { useDesktop } from "@/lib/media";
import { renderCard, shareResult, type ShareTarget } from "@/lib/share";
import { btn, stagger } from "@/lib/ui";
import { openUrgent } from "@/lib/urgent";

/** Chip look shared by the small link rows on both result screens. */
export const CHIP =
  "inline-flex min-h-12 touch-manipulation items-center rounded-full border border-line bg-surface px-4 text-small text-ink transition duration-75 hover:border-lamp/60 hover:bg-surface-2 active:scale-[0.98]";

/** One compact row. The card is drawn up front so the share sheet opens instantly. */
function ShareRow({ worry, verdict }: { worry: ShareTarget; verdict: Verdict }) {
  const [card, setCard] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let dead = false;
    renderCard(worry, verdict)
      .then((blob) => !dead && setCard(blob))
      .catch(() => undefined);
    return () => {
      dead = true;
    };
  }, [worry, verdict]);

  const share = async () => {
    setBusy(true);
    const outcome = await shareResult(worry, verdict, card ?? undefined);
    setBusy(false);
    if (outcome === "whatsapp") toast("Opening WhatsApp. The link is in the message.");
    else if (outcome === "copied") toast("Link copied. Paste it wherever they are.");
    else if (outcome === "failed") toast("Couldn't share from here. Copy the link from the address bar instead.");
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-line bg-surface p-4">
      <p className="min-w-0">
        <span className="block font-display text-[1.1875rem] leading-snug text-ink">Know someone worrying too?</span>
        <span className="block text-small text-ink-muted">The card has no numbers or personal details.</span>
      </p>
      <button type="button" onClick={share} disabled={busy} className={btn("secondary", "shrink-0")}>
        <Share2 className="size-4" aria-hidden="true" />
        {busy ? "Preparing" : "Share"}
      </button>
    </div>
  );
}

/** The first paragraph, with the rest one tap away. */
function Explainer({ paragraphs }: { paragraphs: string[] }) {
  const [more, setMore] = useState(false);
  const [first, ...rest] = paragraphs;

  return (
    <Section title="What might be going on">
      <div className="space-y-3.5 text-body text-ink">
        <p>{first}</p>
        {more && rest.map((p, k) => <p key={k}>{p}</p>)}
      </div>
      {rest.length > 0 && (
        <button
          type="button"
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
          className="mt-1 inline-flex min-h-12 touch-manipulation items-center gap-1.5 rounded-xl text-body font-semibold text-lamp underline-offset-4 hover:underline"
        >
          {more ? "Show less" : "Read more"}
          <ChevronDown className={`size-4 transition-transform duration-200 ${more ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      )}
    </Section>
  );
}

/** True while the element is on screen. `layout` re-attaches it when the element is re-created. */
function useOnScreen(layout: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [layout]);
  return [ref, on] as const;
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
  /** Laptop only: the main call to action under the verdict (curated: the tracker). */
  asideAction?: ReactNode;
  /** The main next action. Sits in a slim bar at the bottom of a phone screen. */
  next: { label: string; href: string };
  /** Phone only: an extra row of small links above the accordions (curated: the example). */
  more?: ReactNode;
  /** The feedback row. */
  feedback: ReactNode;
  /** The "Why should I trust this?" accordion. */
  trust: ReactNode;
  /** "Check something else": where it goes, and anything to do on the way. */
  checkElse: { href: string; onClick?: () => void };
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
  next,
  more,
  feedback,
  trust,
  checkElse,
  wipe,
}: ResultViewProps) {
  const desktop = useDesktop();
  const [closingRef, closingOn] = useOnScreen(desktop);

  const verdict = <VerdictCard result={result} count={count} ai={ai} />;

  const whoToSee = result.whoToSee ? (
    <p className="flex items-start gap-3 rounded-[22px] bg-surface-2 px-4 py-3.5 text-body text-ink">
      <Stethoscope className="mt-[0.2em] size-5 shrink-0 text-lamp" aria-hidden="true" />
      <span>
        Who to see: <b className="font-semibold">{result.whoToSee}</b>
      </span>
    </p>
  ) : null;

  const tonight = (
    <Section title="What to do tonight">
      <TonightSteps tryTonight={result.tryTonight} verdict={result.verdict} />
    </Section>
  );

  const explainer = <Explainer paragraphs={result.explainer} />;

  const dontSection = (
    <Disclosure title="Tonight, don't" summary={`${donts.length} things to skip tonight`}>
      <Donts items={donts} />
    </Disclosure>
  );

  // Safety stays open: it is the one section nobody should have to hunt for.
  const flags = (
    <Section title="When to get help">
      <RedFlags flags={result.redFlags} />
      <button
        type="button"
        onClick={openUrgent}
        className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-xl text-body font-medium text-doctor underline decoration-doctor/40 underline-offset-4 transition-colors hover:decoration-doctor"
      >
        <LifeBuoy className="size-4" aria-hidden="true" />
        See the urgent-help signs
      </button>
    </Section>
  );

  const doctor = <DoctorNote title={title} result={result} at={at} ai={ai} />;

  const closing = (
    <div ref={closingRef} className="space-y-4 border-t border-line pt-6">
      <p className="font-display text-[1.375rem] italic leading-snug text-ink-muted">You have what you need for tonight.</p>
      <a href={checkElse.href} onClick={checkElse.onClick} className={btn("primary", "w-full lg:w-auto lg:px-8")}>
        Check something else
      </a>
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
        <aside className="sticky top-24 col-span-5 space-y-4">{stack([verdict, whoToSee, asideAction])}</aside>

        <div className="col-span-7 space-y-7">
          {stack([
            tonight,
            explainer,
            dontSection,
            flags,
            doctor,
            trust,
            feedback,
            <ShareRow worry={share} verdict={result.verdict} />,
            <div className="-ml-1">{wipe}</div>,
            closing,
          ])}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-20">
      {stack([
        verdict,
        tonight,
        explainer,
        dontSection,
        flags,
        whoToSee,
        doctor,
        more,
        trust,
        feedback,
        <ShareRow worry={share} verdict={result.verdict} />,
        <div className="-ml-1">{wipe}</div>,
        closing,
      ])}

      {/* Slim bar with the main next action. It steps aside once the closing button is on screen. */}
      <div
        inert={closingOn}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] transition-transform duration-200 ${closingOn ? "translate-y-full" : ""}`}
      >
        <div className="mx-auto max-w-[480px]">
          <a href={next.href} className={btn("primary", "w-full")}>
            {next.label}
          </a>
        </div>
      </div>
    </div>
  );
}
