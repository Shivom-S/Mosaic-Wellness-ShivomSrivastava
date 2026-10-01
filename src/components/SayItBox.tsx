import { useEffect, useState } from "react";
import { ArrowRight, Stethoscope } from "lucide-react";
import { WORRY, matchWorry, type WorryId } from "@/content";
import { href } from "@/lib/route";

const PROMPTS = ["baal bahut gir rahe hain…", "period 10 days late…", "raat ko neend nahi aati…", "my son only eats rice…"];

export function SayItBox() {
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState(0);
  const [match, setMatch] = useState<WorryId | "none" | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setPrompt((p) => (p + 1) % PROMPTS.length), 2800);
    return () => window.clearInterval(t);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMatch(matchWorry(text) ?? "none");
  };

  return (
    <section>
      <h2 className="font-display text-[22px] leading-snug">Or say it your way</h2>
      <p className="mt-1 text-[14px] text-ink-muted">English, Hinglish, however it comes out at 1 AM.</p>

      <form onSubmit={submit} className="relative mt-4">
        <label htmlFor="say-it" className="sr-only">
          Describe your worry
        </label>
        <input
          id="say-it"
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setMatch(null);
          }}
          placeholder={PROMPTS[prompt]}
          autoComplete="off"
          autoCapitalize="none"
          enterKeyHint="send"
          className="field h-14 rounded-full pl-5 pr-[60px]"
        />
        <button
          type="submit"
          aria-label="Find my worry"
          disabled={!text.trim()}
          className="absolute right-1.5 top-1.5 inline-flex size-11 touch-manipulation items-center justify-center rounded-full bg-lamp text-on-lamp transition active:scale-95 disabled:bg-surface-2 disabled:text-ink-faint"
        >
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </form>

      <div aria-live="polite">
        {match && match !== "none" && (
          <a
            href={href({ name: "check", id: match })}
            className="mt-3 flex animate-fade-up items-center justify-between gap-3 rounded-2xl border border-lamp/40 bg-lamp/10 px-4 py-3.5 text-[16px] leading-snug"
          >
            <span>
              Sounds like <b className="font-semibold">{WORRY[match].title}</b>.
            </span>
            <span className="shrink-0 font-semibold text-lamp">Start the check →</span>
          </a>
        )}
        {match === "none" && (
          <p className="mt-3 flex animate-fade-up items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] leading-relaxed text-ink-muted">
            <Stethoscope className="mt-0.5 size-5 shrink-0 text-doctor" aria-hidden="true" />
            <span>
              We only cover four worries right now, on purpose. If it's sudden, severe or scary, don't wait on an app.
              See a doctor.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
