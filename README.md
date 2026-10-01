# 1AM

**Honest answers to the health worries you'd never say out loud.**

A consumer health web app built for the Mosaic Wellness CEO's Office Builder Round.

People don't wake up wanting a wellness app. They show up at 1 AM with a private worry, like
hair in the drain, a late period, waking at 3 AM, or a toddler who won't eat, and they type it
into a search bar. 1AM answers that moment in about 60 seconds, using the thresholds
specialists actually use, and shows the source on every answer.

- **Four worries, done properly.** Hair shedding (with a tap-to-count ritual), cycle
  regularity, night waking, and picky toddlers.
- **A plain verdict.** *Normal*, *keep an eye on it*, or *worth a doctor visit*. Each comes with
  what's probably going on, the red flags, one thing to try tonight, and a doctor-ready summary.
- **Optional tracking.** 14 days (7 for toddlers, period start dates for cycles) turn a 1 AM
  guess into a trend. Seeded, clearly labelled examples show the payoff to someone who's
  only got a minute.
- **"Say it your way".** Free text in English or Hinglish ("baal bahut gir rahe hain") is
  matched to a worry deterministically. No AI call.
- **Private by design.** No account, no analytics, no network calls. Everything stays in
  `localStorage` on the phone, with a one-tap wipe.
- **Honest over helpful-sounding.** No products and no cart. Often the answer is "you're fine".

## How it's built

| Layer | What |
| --- | --- |
| UI | React 19, TypeScript, Vite, Tailwind CSS 3, vaul drawer, Radix accordion/dialog, Sonner toasts |
| Content + logic | `src/content/`: typed worry definitions, deterministic `evaluate()` and `trend()` functions, and the source registry. Every number in the app maps to an entry in `sources.ts`. |
| Checks | `npx tsx scripts/check-content.ts` runs scenario tests over every verdict branch, the examples and the matcher |
| Backend | `server/`: Express + PostgreSQL on Replit. It stores only anonymous "did this help?" ratings (worry type, verdict type, rating) and serves a live aggregate `/api/pulse`. It's optional: without `VITE_API_URL` the app runs fully offline. |
| Hosting | Frontend on Vercel (`vercel.json`), API on Replit (`.replit`) |

```bash
pnpm install
pnpm dev          # local dev server
pnpm build        # type-check + production build to dist/
npx tsx scripts/check-content.ts
```

## How AI was used

- **Deciding what to build:** I ran a five-advisor "LLM council" in Claude (contrarian,
  first-principles, expansionist, outsider, executor). The advisors answered independently,
  peer-reviewed each other anonymously, and a chairman synthesised the result. The council
  converged on "answer the moment of worry". Its most popular extra, an operator dashboard on
  synthetic data, was cut, because made-up statistics have no place in a trust product.
- **Research:** Claude gathered the thresholds from AAD, Cleveland Clinic, ACOG, the US
  Office on Women's Health, the National Sleep Foundation, AASM, Stanford's CBT-I program, AAP,
  Seattle Children's and CHOP. All of them are cited in the app.
- **Building:** the medical content and verdict logic were written and tested first.
  [Claude Code](https://claude.com/claude-code) then built the interface from `SPEC.md`, and
  the result was reviewed screen by screen in a mobile browser and polished in further passes.

## Not medical advice

1AM explains common thresholds and when to see a doctor. It doesn't diagnose anything.


Access the app here: https://mosaic-wellness-shivom-srivastava.vercel.app/
