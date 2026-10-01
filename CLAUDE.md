# 1AM: notes for coding agents

- Read `SPEC.md` first. It is the source of truth for screens, copy and design rules.
- `src/content/*` holds the medical content, thresholds, sources and verdict logic. Treat it as read-only.
  Verify it with `npx tsx scripts/check-content.ts`.
- Stack: React 19 + TypeScript + Vite + Tailwind 3 (tokens in `tailwind.config.cjs` / `src/index.css`), pnpm.
- Use only token colours; no raw hex outside the canvas share card.
- `pnpm build` must pass before you finish.
