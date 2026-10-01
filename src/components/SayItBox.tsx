import { useEffect, useRef, useState } from "react";
import { ArrowRight, LifeBuoy, Mic } from "lucide-react";
import { WORRY, matchWorry, type WorryId } from "@/content";
import { aiStatus, understand } from "@/lib/api";
import { clearAllPrefill, sanitizeAnswers, savePrefill } from "@/lib/prefill";
import { href } from "@/lib/route";
import { keys, store } from "@/lib/storage";
import { openUrgent } from "@/lib/urgent";
import { cn } from "@/lib/utils";

const PROMPTS = ["baal bahut gir rahe hain…", "period 10 days late…", "raat ko neend nahi aati…", "my son only eats rice…"];

// The Web Speech API isn't in lib.dom for every TS version, so describe the bit we use.
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<SpeechResultLike> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => RecognitionLike;

function speechCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface SayItBoxProps {
  value: string;
  onValue: (text: string) => void;
  /** Lets another part of the page (a Popular chip) submit text as if it had been typed. */
  request?: { text: string; n: number } | null;
}

interface Heard {
  echo: string;
  filled: number;
}

/** The main input: type it, or say it. Keyword matching on the phone; an optional AI only routes and pre-fills. */
export function SayItBox({ value, onValue, request }: SayItBoxProps) {
  const [prompt, setPrompt] = useState(0);
  const [match, setMatch] = useState<WorryId | "none" | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [reading, setReading] = useState(false);
  const [heard, setHeard] = useState<Heard | null>(null);
  const token = useRef(0);
  const rec = useRef<RecognitionLike | null>(null);
  const supported = useRef(speechCtor() !== null).current;

  useEffect(() => {
    const t = window.setInterval(() => setPrompt((p) => (p + 1) % PROMPTS.length), 2800);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => () => rec.current?.stop(), []);

  // Find out early whether an AI is connected, so the note shows and the first submit isn't slowed.
  useEffect(() => {
    let live = true;
    void aiStatus().then((ai) => live && setAiOn(Boolean(ai)));
    return () => {
      live = false;
    };
  }, []);

  // A chip elsewhere on the page can fill the box; a cleared box clears the answer too.
  useEffect(() => {
    if (!value.trim()) {
      token.current += 1;
      setMatch(null);
      setReading(false);
      setHeard(null);
    }
  }, [value]);

  const run = async (text: string) => {
    if (!text.trim()) return;
    const mine = ++token.current;
    clearAllPrefill();
    setHeard(null);
    const local = () => setMatch(matchWorry(text) ?? "none");

    if (!(await aiStatus())) return local();
    if (mine !== token.current) return;
    setMatch(null);
    setReading(true);
    const got = await understand(text);
    if (mine !== token.current) return; // the box changed while we waited
    setReading(false);
    if (!got) return local();

    if (got.urgent) openUrgent();
    if (!got.worry) return setMatch("none");
    const answers = sanitizeAnswers(got.worry, got.answers);
    savePrefill(got.worry, answers);
    setHeard({ echo: got.echo, filled: Object.keys(answers).length });
    setMatch(got.worry);
  };

  useEffect(() => {
    if (request?.text.trim()) void run(request.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.n]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(value);
  };

  const toggleMic = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const Ctor = speechCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    let heard = "";
    r.onresult = (e) => {
      heard = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(" ")
        .trim();
      onValue(heard);
    };
    r.onerror = () => setListening(false);
    r.onend = () => {
      setListening(false);
      void run(heard);
    };
    rec.current = r;
    token.current += 1;
    setMatch(null);
    setReading(false);
    setHeard(null);
    setListening(true);
    try {
      r.start();
    } catch {
      setListening(false);
    }
    // Be upfront the first time: the browser's speech service does the listening.
    if (store.get<boolean>(keys.voiceNote) !== true) {
      setVoiceNote(true);
      store.set(keys.voiceNote, true);
    }
  };

  return (
    <section aria-labelledby="say-it-title">
      <form onSubmit={submit} className="relative">
        <label htmlFor="say-it" id="say-it-title" className="mb-2.5 block font-display text-[22px] leading-snug text-ink lg:text-[24px]">
          What's on your mind?
        </label>
        <div className="relative">
          <input
            id="say-it"
            type="text"
            value={value}
            onChange={(e) => {
              onValue(e.target.value);
              token.current += 1;
              setMatch(null);
              setReading(false);
              setHeard(null);
            }}
            placeholder={listening ? "Listening… say it however it comes out" : PROMPTS[prompt]}
            autoComplete="off"
            autoCapitalize="none"
            enterKeyHint="send"
            className={cn(
              "field h-[60px] rounded-full pl-6 text-[17px] shadow-sm lg:h-16 lg:text-[18px]",
              supported ? "pr-[116px]" : "pr-[68px]",
              listening && "border-lamp",
            )}
          />
          <div className="absolute right-2 top-2 flex items-center gap-1 lg:top-2.5">
            {supported && (
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={listening}
                aria-label={listening ? "Stop listening" : "Say it out loud"}
                className={cn(
                  "relative inline-flex size-11 touch-manipulation items-center justify-center rounded-full border transition active:scale-95",
                  listening
                    ? "border-lamp bg-lamp/15 text-lamp"
                    : "border-line text-ink-muted hover:border-lamp/60 hover:text-lamp",
                )}
              >
                {listening && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-lamp/20" />}
                <Mic className="relative size-5" aria-hidden="true" />
              </button>
            )}
            <button
              type="submit"
              aria-label="Find my worry"
              disabled={!value.trim()}
              className="inline-flex size-11 touch-manipulation items-center justify-center rounded-full bg-lamp text-on-lamp transition hover:brightness-110 active:scale-95 disabled:bg-surface-2 disabled:text-ink-faint"
            >
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      <p className="mt-2.5 text-[13px] leading-snug text-ink-muted">
        {listening ? (
          <span role="status" className="font-medium text-lamp">
            Listening… say it however it comes out
          </span>
        ) : (
          "English, Hinglish, however it comes out at 1 AM."
        )}
      </p>
      {aiOn && (
        <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">
          Typed text is sent to an AI model just to understand it. 1AM doesn't store it.
        </p>
      )}
      {voiceNote && (
        <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">
          Voice uses your browser's speech service. Typing stays on your phone.
        </p>
      )}

      <div aria-live="polite">
        {reading && <p className="mt-3 text-[15px] leading-snug text-ink-muted">Reading what you wrote…</p>}
        {match && match !== "none" && (
          <a
            href={href({ name: "check", id: match })}
            className="mt-3 flex animate-fade-up items-center justify-between gap-3 rounded-2xl border border-lamp/40 bg-lamp/10 px-4 py-3.5 text-[16px] leading-snug transition-colors hover:bg-lamp/20"
          >
            <span className="min-w-0">
              Sounds like <b className="font-semibold">{WORRY[match].title}</b>.
              {heard?.echo && <span className="mt-1 block italic text-ink-muted">We heard: “{heard.echo}”</span>}
              {heard && heard.filled > 0 && (
                <span className="mt-1 block text-[14px] text-ink-muted">
                  We've filled in {heard.filled} {heard.filled === 1 ? "answer" : "answers"} from what you wrote. You can change them.
                </span>
              )}
            </span>
            <span className="shrink-0 font-semibold text-lamp">Start the check →</span>
          </a>
        )}
        {match === "none" && (
          <div className="mt-3 animate-fade-up rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] leading-relaxed text-ink-muted">
            <p>
              We only cover four worries right now, on purpose. If it's sudden, severe or scary, don't wait on an app.
              See a doctor.
            </p>
            <button
              type="button"
              onClick={openUrgent}
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-doctor/60 px-4 text-[14px] font-semibold text-doctor transition hover:bg-doctor/10"
            >
              <LifeBuoy className="size-4" aria-hidden="true" />
              Need help right now?
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
