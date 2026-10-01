# 1AM: build spec

> Honest answers to the health worries you'd never say out loud.

A consumer health web app for the Mosaic Wellness CEO's Office Builder Round. Reviewers will
open the link **on a phone**, cold, with about 60 seconds of attention. The whole app has to
pay off within that window: no sign-up, no onboarding, no empty states.

## Non-negotiables

1. **Content and logic are already written** in `src/content/` and tested by
   `scripts/check-content.ts` (`npx tsx scripts/check-content.ts`). Do **not** change verdict
   logic, thresholds, medical copy or sources. UI copy around them (buttons, small labels,
   empty states) is yours to write in the same voice.
2. **No AI calls, no network calls, no analytics, no cookies.** Everything is deterministic
   and local. The only storage is `localStorage` (key prefix `1am:`), wrapped in try/catch so
   private mode still works.
3. **Mobile first.** Design at 375×812, then make sure it looks deliberate at 1280 wide (a
   centred column of max ~480px, with the night sky filling the rest). Tap targets ≥ 44px.
   Use `100dvh` and `env(safe-area-inset-*)` padding.
4. **Fast on a cheap Android phone.** No heavy libraries. You may use `lucide-react` icons,
   `sonner` for toasts, `vaul` (Drawer) and Radix Accordion/Dialog/Collapsible through
   `src/components/ui/*`. No framer-motion. Use CSS transitions and the keyframes in the
   Tailwind config.
5. **Accessible.** Semantic buttons, `aria-pressed` on chips, `aria-live="polite"` on the
   counter and verdict, visible focus, honour `prefers-reduced-motion` (already in CSS),
   colour is never the only signal (verdicts always have a text label and an icon).
6. TypeScript strict and the build must pass: `pnpm build`. `noUnusedLocals` is on.

## Design language

- Tokens live in `tailwind.config.cjs` and `src/index.css`. Use **only** the token colours:
  `bg surface surface-2 line ink ink-muted ink-faint lamp on-lamp normal watch doctor`.
  No raw hex values in components.
- Default theme is **night** (deep ink-blue). A small lamp toggle in the header switches to
  **"lamp on"** (warm paper) by setting `document.documentElement.dataset.theme = "lamp"`.
  Persist it. Also update `<meta name="theme-color">`.
- Type: `font-display` (Fraunces, soft) for headlines and big numbers, with italics for
  emphasis words. `font-sans` (Figtree) for everything else. Headlines should feel editorial
  and warm, nothing like a SaaS dashboard.
- Avoid AI-slop tropes: no purple gradients, no centred-everything hero with three feature
  cards, no glassmorphism soup, no emoji as icons. Corners vary: big cards `rounded-[28px]`,
  chips `rounded-full`, small things `rounded-xl`.
- Atmosphere: a subtle star field (a few dozen 1–2px dots, `animate-twinkle` with random
  delays, `aria-hidden`) behind the home screen only in night mode, and a soft amber "lamp
  glow" radial gradient near the top. Keep it understated.
- Verdict colours: `normal` = sage, `watch` = amber, `doctor` = coral. The verdict card uses
  a tinted background (`bg-normal/10`, etc.), a coloured label pill and an icon (normal:
  `Moon`/`Check`, watch: `Eye`, doctor: `Stethoscope`).
- Motion: screens `animate-fade-up` on enter, staggered children (inline `animationDelay`).
  The verdict label pops in (`animate-pop-in`). Keep motion short.
- Voice: calm, private, a little funny, never alarmist, and short sentences. Use Indian context
  where natural (chai, dal, exam season, dengue). Never claim a doctor reviewed anything.

## Information architecture

Single page with a tiny state router (no react-router). Keep the "screen" state in
`App.tsx` and sync it to `location.hash` (`#/`, `#/check/hair`, `#/result/hair`,
`#/track/hair`, `#/example/hair`, `#/about`) so the back button works and links can be shared.
Scroll to top on every screen change.

```
src/
  App.tsx                 screen state + hash sync + theme
  lib/storage.ts          typed localStorage helpers (get/set/remove/wipeAll) under "1am:"
  lib/share.ts            share-card PNG (canvas) + Web Share API + fallbacks
  lib/clock.ts            greeting copy based on local time
  components/
    Shell.tsx             header (logo, lamp toggle, menu) + footer + safe areas
    StarField.tsx
    WorryCard.tsx
    SayItBox.tsx          free-text matcher
    ChipGroup.tsx         single/multi chips, `exclusive` option support
    HairCounter.tsx       the tap-to-count ritual
    QuestionFlow.tsx      one question per step, progress, back
    VerdictCard.tsx
    RedFlags.tsx
    DoctorNote.tsx        doctor-ready summary + copy button
    Sources.tsx           collapsible list of sources with org + link
    DotStrip.tsx          14 (or 7) dots, filled per entry, coloured by status
    MiniChart.tsx         tiny inline SVG bar chart with optional reference line
    TrackerDaily.tsx      log today's entry for DailyTracker
    TrackerDates.tsx      add/remove period start dates for DatesTracker
    TrendCard.tsx         renders TrendResult
    WipeButton.tsx        confirm, then wipe all 1am: keys, toast "Gone. Nothing left on this phone."
  screens/
    Home.tsx
    Check.tsx             hair → HairCounter then QuestionFlow; others → QuestionFlow
    Result.tsx
    Track.tsx
    Example.tsx
    About.tsx
```

## Screens

### Home (`#/`)
- Top: small wordmark "1AM" (Fraunces, with a tiny crescent moon SVG mark) on the left, lamp
  toggle and a "Why I built this" link on the right.
- The **live clock line** is the hero, using the local time:
  - 00:00–04:59 → "It's **1:07 AM**." + "And you're googling it again."
  - 05:00–11:59 → "It's **9:14 AM**." + "Worries don't keep office hours."
  - 12:00–17:59 → "It's **3:42 PM**." + "Some questions are easier to ask a screen."
  - 18:00–23:59 → "It's **10:51 PM**." + "The 1 AM thoughts are warming up."
  Show the time huge in `font-display`, then the H1: "Honest answers to the health worries
  you'd never say out loud."
- Sub-line (small, muted): "Real thresholds from dermatologists, gynaecologists, sleep
  doctors and paediatricians. No sign-up. Nothing leaves your phone. Nothing to buy."
- **Four worry cards** (from `WORRIES`), stacked, each showing the `whisper` in italic display
  type as a quote ("“Am I going bald?”"), the `title`, the `blurb`, and a small arrow. If the
  person has an in-progress tracker for that worry, show a lamp-coloured pill like
  "Day 6 of 14 · log today".
- **SayItBox**: "Or say it your way" with an input (placeholder rotates between examples:
  "baal bahut gir rahe hain…", "period 10 days late…", "raat ko neend nahi aati…",
  "my son only eats rice…"). On submit, `matchWorry()`: if it matches, show an inline card
  "Sounds like **Hair in the drain**. Start the check →". If not: "We only cover four
  worries right now, on purpose. If it's sudden, severe or scary, don't wait on an app. See
  a doctor." No network.
- **"See how tracking pays off"** row: a horizontal strip linking to the 4 examples
  (`#/example/:id`), labelled "Example 14 days" etc. This makes the retention story visible to
  a cold reviewer within seconds.
- Footer: "Not medical advice. 1AM explains common thresholds and when to see a doctor. It
  doesn't diagnose." · "Wipe everything" button · "Why I built this →".

### Check (`#/check/:id`)
- Header shows the worry title and a step indicator (thin progress bar in `lamp`), with a back
  arrow (back from step 1 → home).
- **Hair only, step 0: HairCounter (the signature interaction, so make it delightful).**
  - Title: "Count tonight's hairs." Help: "Check your pillow, your comb or brush, the shower
    drain, and anywhere else (clothes, floor). Tap once per hair."
  - Four location tabs (Pillow · Comb · Drain · Elsewhere), each with its own count. A big
    circular tap pad (≥ 200px) in the middle. Each tap: +1 with a quick scale feedback,
    `navigator.vibrate?.(8)`, and **a little hair strand drawn into the pad** (a random
    curved SVG path, thin, `ink` at 60% opacity, random rotation/position, capped at ~120
    strands rendered). Below: "+5" and "−1" small buttons. The total is shown big
    (`font-display`, tabular nums, `aria-live`).
  - A live mini gauge under the total: a horizontal bar from 0 to 200 with the 50–100 "normal"
    band shaded in `normal/25` and a marker at the current total. Label: "Dermatologists:
    50–100 a day is normal."
  - Secondary link: "Not near a drain right now? **Use an example count**", which fills
    pillow 14, comb 41, drain 58, elsewhere 9 and shows a toast "Example count loaded. Do the
    real one tonight."
  - Primary button: "That's everything →" (disabled at 0 unless the person taps "I found
    none", a tiny link that sets 0 and continues).
- **Questions:** one per screen, large chips (full-width stacked buttons for single-select;
  wrap chips for multi-select with a "Continue" button). Single-select auto-advances after a
  short 180ms highlight. `exclusive` options clear the others and vice versa. Show `help`
  under the prompt in muted text, and `hint` inside the chip in smaller muted text.
- On finish: compute the `Result` with `worry.evaluate({ answers, count })`, save
  `{answers, count, result, at}` to `1am:last:<id>`, go to `#/result/:id`.

### Result (`#/result/:id`)
Reads the last check from storage (if missing, redirect to the check). Layout, top to bottom:
1. **VerdictCard:** tinted by verdict. Label pill (e.g. "NORMAL" / "KEEP AN EYE ON IT" /
   "WORTH A DOCTOR VISIT") with icon, then `headline` in big display type, and `urgency`
   (if present) as a bold coral line. For hair, show the count big too ("111 hairs").
2. **"What's probably going on"**: `explainer` paragraphs.
3. **"Try tonight"**: a lamp-tinted callout with a small lamp icon and `tryTonight`.
4. **RedFlags:** "See a doctor if any of these are true". List all, with hit ones
   highlighted in `doctor` with a filled marker and "← you said this". If none hit, a quiet
   line at the end: "None of these apply to you."
5. **whoToSee** (if present): "Who to see: **A dermatologist**".
6. **DoctorNote** (collapsible, open by default when verdict is `doctor`): "Doctor-ready
   summary" with the `doctorNote` lines and a "Copy" button (clipboard, toast "Copied. Paste
   it into WhatsApp or show it at the clinic.").
7. **Track CTA** (if `suggestTracking` or always as secondary): "Not sure? Track it for 14
   days" (7 for toddler, "log your dates" for cycle), then `#/track/:id`. Plus a link "See
   what 14 days looks like" to `#/example/:id`.
8. **Share:** "Send to someone who's worrying about the same thing". Generates the share card
   (see below) and calls `navigator.share({ files, text, url })`. Fall back to
   `https://wa.me/?text=` with the text + URL, and finally to copying to the clipboard. The
   card **never includes counts, answers or anything personal**. Only the worry title, the
   verdict label and a generic line.
9. **Sources:** "Where these numbers come from", list of `sourceList(result.sources)` with
   org name bold, title and an external link (`target=_blank rel=noopener`).
10. Small row: "Check again" · "Wipe this from my phone".

### Track (`#/track/:id`)
- Header: worry title + "Day N of 14" (or "N dates logged" for cycle).
- `DotStrip` across the top (N dots, past entries coloured by `trend().dots`, today's slot
  outlined in `lamp`, future slots faint).
- **TrackerDaily:** render the tracker's `fields` for **today** (number fields get a stepper
  with −/+ and a direct number input; hair also gets a "Count with the tap pad" button that
  opens HairCounter in a Drawer and writes the total back; chips use ChipGroup; toggles are a
  pill switch). "Save today" stores into `1am:track:<id>` (array of `DailyEntry`, one per
  date, upsert by date). After saving, show the trend.
- **TrackerDates:** list of start dates (most recent first) with the gap in days between
  each ("29 days"), add via `<input type="date">` (max = today), remove with a small ×.
- **TrendCard:** verdict-coloured, `headline`, `detail`, with `MiniChart` of `series` and the
  `reference` line ("100 / day") when present. For `early`, a neutral style.
- Bottom: "Remind me" is out of scope. Instead, a muted line: "Come back tomorrow. We'll keep
  your place. (It's saved on this phone only.)" and the wipe button for this tracker.

### Example (`#/example/:id`)
- Clearly labelled at the top in a pill: "EXAMPLE · not a real person". Then `persona` and
  `context`.
- The same DotStrip + TrendCard + MiniChart rendered from `worry.example.entries` with
  `worry.tracker.trend()`, so a reviewer sees the payoff instantly. For hair the chart should
  visibly show the count falling towards the 100 line.
- CTA: "Start my own check →" and "See other examples" (chips to the other three).

### About (`#/about`), "Why I built this"
Use this copy (light editing for flow is fine, keep the substance):

**Why 1AM exists**
People don't wake up wanting a wellness app. They show up at 1 AM with a private worry: hair
in the drain, a late period, a toddler who won't eat. They type it into a search bar they'd
never say out loud to a person. What they get back is a wall of forums, worst cases and ads.

Mosaic's own line is that health is a *pull* business, not a push one. The pull happens in
that moment of worry. Whoever answers it honestly earns the trust that every long
relationship afterwards is built on.

**What it does**
Four worries, each answered in about 60 seconds against the thresholds specialists actually
use, with the source shown on every answer. A verdict in plain words: *normal*, *keep an eye on
it*, or *worth a doctor visit*. One thing to try tonight. A doctor-ready summary if you need
one. And if one data point isn't enough, an optional 14-day tracker that turns a 1 AM guess
into a trend.

**The decisions**
- *Honest over helpful-sounding.* Brand quizzes end in a cart. 1AM often ends in "you're
  fine, don't buy anything". That's deliberate: trust before transaction.
- *Rules, not a chatbot.* Every verdict is deterministic and traceable to a cited threshold.
  It never makes up a statistic, never breaks without an API key, and the same answers always
  give the same verdict.
- *Four worries, done properly.* Breadth is easy to add once the engine and the tone work.
- *Private by design.* No account, no analytics, nothing sent anywhere. Phones get shared,
  so there's a one-tap wipe.
- *Cut on purpose:* a symptom-checker "AI doctor", streaks and gamification, product
  recommendations, and an operator dashboard built on synthetic data. (Made-up statistics
  have no place in a trust product.)

**What I'd measure**
Not DAU. The leading indicators for a product like this are: **worry-resolved rate** (did
the person leave calmer, or with a clear next step?), **day-7 return among people who
started tracking**, and **doctor-visit follow-through** for "worth a doctor visit"
verdicts.

**What the questions would tell a business**
Every worry typed into the "say it your way" box is a demand signal: what people are
anxious about, in their own words, before they're anyone's customer. Aggregated and
anonymised, with consent, that's an early-warning system for categories. It's the only
dashboard I'd want to build next, and only on real data.

**How AI helped**
I used Claude in two ways. First, as a *council*: five AI advisors with deliberately
different lenses (contrarian, first-principles, expansionist, outsider, executor) debated
what to build, then anonymously reviewed each other. That council's most popular "big idea",
an operator dashboard, was the one I cut. Second, as a *builder*: Claude Code wrote the
interface from my spec, while every threshold and every line of medical copy was checked
against the sources listed below.

**Sources:** the full list from `SOURCES`, grouped by organisation.

**Built by** Shivom Srivastava · Economics & Finance, Ashoka University · for the Mosaic
Wellness CEO's Office Builder Round. Add a link to the GitHub repo:
`https://github.com/Shivom-S/Mosaic-Wellness-ShivomSrivastava`.

## Share card (`lib/share.ts`)
Canvas 1080×1350 PNG. Night background (#0B0F1A), faint stars, small crescent + "1AM"
wordmark, then the line "I checked at 1 AM." in display serif, the worry title, and a big
verdict pill with its label. Footer: "Honest answers to the health worries you'd never say
out loud" + the site's origin. Make sure fonts are loaded (`document.fonts.ready`) before
drawing. Text for share: `"Checked “{whisper}” on 1AM: {verdict label}. Honest answers, cited sources, no sign-up: {url}"`.
This is the one place raw hex is allowed (canvas).

## Storage keys
- `1am:theme`: "night" | "lamp"
- `1am:last:<worryId>`: last check `{ answers, count?, result, at }`
- `1am:track:<worryId>`: `DailyEntry[]`
- `wipeAll()` removes every key starting with `1am:`.

## Done means
- `pnpm build` passes with zero TS errors.
- The full journey works for all four worries on a 375px viewport, plus the example pages,
  tracker save/reload and wipe.
- No console errors.
- Delete the leftover template files (`src/assets/*`) if they're unused. Don't touch
  `src/content/*` or `scripts/check-content.ts`.
