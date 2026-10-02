import { useEffect, useRef, useState } from "react";
import { ArrowRight, LifeBuoy, Mic } from "lucide-react";
import { WORRIES, WORRY, matchWorry, type WorryId } from "@/content";
import { aiQuestions, aiStatus, checksStatus, understand } from "@/lib/api";
import { clearAllPrefill, sanitizeAnswers, savePrefill } from "@/lib/prefill";
import { href } from "@/lib/route";
import { keys, session, store, type AiPending } from "@/lib/storage";
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
  onerror: ((e: { error?: string }) => void) | null;
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
  /** Set only for a concern we don't cover. */
  triage?: Triage;
}

type Triage = { topic: string; specialist: string };

/** What came back from trying to build an AI check. */
type AiNote = { kind: "fail" } | { kind: "notHealth" } | { kind: "urgent"; canContinue: boolean };

function CheckChips() {
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {WORRIES.map((w) => (
        <li key={w.id}>
          <a
            href={href({ name: "check", id: w.id })}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-3.5 text-[13px] font-medium text-ink transition hover:border-lamp/60 hover:bg-surface-2"
          >
            {w.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** The main input: type it, or say it. Keyword matching on the phone; an optional AI only routes and pre-fills. */
export function SayItBox({ value, onValue, request }: SayItBoxProps) {
  const [prompt, setPrompt] = useState(0);
  const [match, setMatch] = useState<WorryId | "none" | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState<string | null>(null);
  const [aiOn, setAiOn] = useState(false);
  const [reading, setReading] = useState(false);
  const [heard, setHeard] = useState<Heard | null>(null);
  const [checksOn, setChecksOn] = useState(false);
  /** Set while an AI check is being written: the topic if we know it, else "". */
  const [building, setBuilding] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<AiNote | null>(null);
  const lastText = useRef("");
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
    void checksStatus().then((c) => live && setChecksOn(Boolean(c)));
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
      setBuilding(null);
      setAiNote(null);
    }
  }, [value]);

  /** Write a check for exactly what was typed. Success goes straight to the questions. */
  const buildAi = async (text: string, topic = "") => {
    const mine = ++token.current;
    setMatch(null);
    setHeard(null);
    setAiNote(null);
    setBuilding(topic);
    const got = await aiQuestions(text);
    if (mine !== token.current) return; // the box changed while we waited
    setBuilding(null);
    if (!got) return setAiNote({ kind: "fail" });
    if (!got.health) return setAiNote({ kind: "notHealth" });
    if (got.urgent) openUrgent();
    if (got.check) {
      const pending: AiPending = { text: text.trim().slice(0, 500), check: got.check, createdAt: Date.now() };
      session.set(keys.aiCheck, pending);
      if (!got.urgent) {
        window.location.hash = href({ name: "ai-check" });
        return;
      }
    }
    setAiNote({ kind: "urgent", canContinue: Boolean(got.check) });
  };

  /** Nothing in the seven reviewed checks fits. With AI checks on, write one; otherwise say so honestly. */
  const noMatch = async (text: string, mine: number, triage?: Triage) => {
    const on = await checksStatus();
    if (mine !== token.current) return;
    if (on) return buildAi(text, triage?.topic ?? "");
    if (triage) setHeard({ echo: "", filled: 0, triage });
    setMatch("none");
  };

  const run = async (text: string) => {
    if (!text.trim()) return;
    const mine = ++token.current;
    lastText.current = text;
    clearAllPrefill();
    setHeard(null);
    setBuilding(null);
    setAiNote(null);
    const local = () => {
      const m = matchWorry(text);
      if (m) setMatch(m);
      else void noMatch(text, mine);
    };

    if (!(await aiStatus())) return local();
    if (mine !== token.current) return;
    setMatch(null);
    setReading(true);
    const got = await understand(text);
    if (mine !== token.current) return; // the box changed while we waited
    setReading(false);
    if (!got) return local();

    if (got.urgent || got.triage?.specialist === "emergency care") openUrgent();
    if (!got.worry) return noMatch(text, mine, got.triage ?? undefined);
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
    setVoiceMsg(null);
    let r: RecognitionLike;
    try {
      r = new Ctor();
    } catch {
      setVoiceMsg("Voice isn't available in this browser. Typing works just as well.");
      return;
    }
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    // Android Chrome returns cumulative results (each entry repeats the earlier words),
    // so joining them duplicates text. There, the last entry is the whole utterance.
    const android = /Android/i.test(navigator.userAgent);
    let heard = "";
    let failed = false;
    r.onresult = (e) => {
      const list = Array.from(e.results);
      heard = (android ? (list[list.length - 1]?.[0]?.transcript ?? "") : list.map((x) => x[0].transcript).join(" "))
        .replace(/\s+/g, " ")
        .trim();
      onValue(heard);
    };
    r.onerror = (e) => {
      failed = true;
      setListening(false);
      const code = e?.error ?? "";
      setVoiceMsg(
        code === "not-allowed" || code === "service-not-allowed"
          ? "The mic is blocked for this site. Allow it in your browser's site settings, or just type."
          : code === "no-speech"
            ? "Didn't catch that. Tap the mic and try again."
            : code === "audio-capture"
              ? "No microphone found on this device."
              : code === "aborted"
                ? null
                : "Voice isn't working in this browser right now. Typing works just as well.",
      );
    };
    r.onend = () => {
      window.clearTimeout(stopTimer);
      setListening(false);
      if (heard) void run(heard);
      else if (!failed) setVoiceMsg("Didn't catch anything. Tap the mic and try again.");
    };
    rec.current = r;
    token.current += 1;
    setMatch(null);
    setReading(false);
    setHeard(null);
    setBuilding(null);
    setAiNote(null);
    setListening(true);
    // Safety net: some browsers never fire onend if the mic hangs.
    const stopTimer = window.setTimeout(() => {
      try {
        r.stop();
      } catch {
        /* already stopped */
      }
    }, 15000);
    try {
      r.start();
    } catch {
      window.clearTimeout(stopTimer);
      setListening(false);
      setVoiceMsg("Couldn't start the mic. Try again, or just type.");
      return;
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
              setBuilding(null);
              setAiNote(null);
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
              aria-label="Find the right check"
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
      {(aiOn || checksOn) && (
        <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">
          {checksOn
            ? "Typed text is sent to an AI model to understand it and, if none of our checks fit, to write one. 1AM doesn't store it."
            : "Typed text is sent to an AI model just to understand it. 1AM doesn't store it."}
        </p>
      )}
      {voiceNote && (
        <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">
          Voice uses your browser's speech service (in Chrome, that's Google). Typed text stays on your phone.
        </p>
      )}

      <div aria-live="polite">
        {voiceMsg && <p className="mt-3 text-[14px] leading-snug text-watch">{voiceMsg}</p>}
        {reading && <p className="mt-3 text-[15px] leading-snug text-ink-muted">Reading what you wrote…</p>}
        {building !== null && (
          <p className="mt-3 flex items-center gap-2.5 text-[15px] leading-snug text-ink-muted">
            <span aria-hidden="true" className="size-2 shrink-0 animate-pulse rounded-full bg-lamp" />
            Writing a few questions about {building || "this"}…
          </p>
        )}
        {aiNote?.kind === "notHealth" && (
          <p className="mt-3 animate-fade-up text-[15px] leading-relaxed text-ink-muted">
            That doesn't sound like a health worry. Try describing what you're feeling.
          </p>
        )}
        {aiNote?.kind === "fail" && (
          <div className="mt-3 animate-fade-up rounded-2xl border border-line bg-surface px-4 py-4 text-[15px] leading-relaxed text-ink-muted">
            <p>Unable to build a check right now. Try again, or pick one of the checks below.</p>
            <button
              type="button"
              onClick={() => void buildAi(lastText.current)}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-lamp px-5 text-[14px] font-semibold text-on-lamp transition hover:brightness-110 active:scale-95"
            >
              Try again
            </button>
            <CheckChips />
          </div>
        )}
        {aiNote?.kind === "urgent" && (
          <div className="mt-3 animate-fade-up rounded-2xl border border-doctor/40 bg-doctor/10 px-4 py-4 text-[15px] leading-relaxed text-ink">
            <p>If this could be an emergency, don't wait on an app. Call 112 or get to a doctor now.</p>
            <div className="mt-2 flex flex-wrap gap-x-5">
              <button
                type="button"
                onClick={openUrgent}
                className="inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-doctor underline-offset-4 hover:underline"
              >
                <LifeBuoy className="size-4" aria-hidden="true" />
                See the urgent-help signs
              </button>
              {aiNote.canContinue && (
                <a
                  href={href({ name: "ai-check" })}
                  className="inline-flex min-h-11 items-center text-[14px] font-semibold text-lamp underline-offset-4 hover:underline"
                >
                  Continue with a few questions
                </a>
              )}
            </div>
          </div>
        )}
        {match && match !== "none" && (
          <div className="mt-3 animate-fade-up">
            <a
              href={href({ name: "check", id: match })}
              className="flex items-center justify-between gap-3 rounded-2xl border border-lamp/40 bg-lamp/10 px-4 py-3.5 text-[16px] leading-snug transition-colors hover:bg-lamp/20"
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
            {checksOn && (
              <button
                type="button"
                onClick={() => void buildAi(lastText.current)}
                className="mt-1 inline-flex min-h-11 items-center text-left text-[14px] leading-snug text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
              >
                Not quite it? Build a check for exactly what I wrote
              </button>
            )}
          </div>
        )}
        {match === "none" && heard?.triage && (
          <div className="mt-3 animate-fade-up rounded-2xl border border-line bg-surface px-4 py-4 text-[15px] leading-relaxed text-ink-muted">
            <p className="font-display text-[20px] leading-snug text-ink">
              We don't cover {heard.triage.topic || "that"} yet.
            </p>
            <p className="mt-1.5">
              We'd rather say so than guess. The right person to ask:{" "}
              <b className="font-semibold text-ink">{heard.triage.specialist}</b>.
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-faint">
              1AM only gives answers it can back with sources. This suggestion is from an AI model, not a diagnosis.
            </p>
            <button
              type="button"
              onClick={openUrgent}
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-lamp underline-offset-4 hover:underline"
            >
              <LifeBuoy className="size-4" aria-hidden="true" />
              See the urgent-help signs
            </button>
            <p className="mt-2 text-[13px] font-semibold text-ink-muted">Check one of these instead</p>
            <CheckChips />
          </div>
        )}
        {match === "none" && !heard?.triage && (
          <div className="mt-3 animate-fade-up rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] leading-relaxed text-ink-muted">
            <p>
              We only cover {WORRIES.length} worries right now, on purpose. If it's sudden, severe or scary, don't wait on
              an app. See a doctor.
            </p>
            <button
              type="button"
              onClick={openUrgent}
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-doctor/60 px-4 text-[14px] font-semibold text-doctor transition hover:bg-doctor/10"
            >
              <LifeBuoy className="size-4" aria-hidden="true" />
              See the urgent-help signs
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
