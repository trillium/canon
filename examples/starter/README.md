# Canon Starter

A starter Next.js app that follows Canon: the standards modules are applied, every check runs in CI, and
the checks pass on a fresh clone. Copy this folder, rename the project, and build on it.

## What is in it

- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, Biome, Vitest and Playwright.
  Bun runs the check scripts; pnpm manages packages.
- A design system in `src/components/ui`, documented at `/design-system`, with raw HTML banned elsewhere.
- App copy in JSON under `src/content`, including the messages API routes return.
- Playwright screenshot baselines for every page, compared in CI inside a pinned Playwright image.
- A `ENFORCEMENT.md` table that names the mechanism behind every rule, and a check that keeps it honest.

## Scope of this repository

The user-facing application only: screens and the checks around them. Backend logic and real user data
belong elsewhere; build against mock data and stubbed API responses until a backend exists.

## Getting started

```
pnpm install
cp .env.example .env.local   # all values stay empty until you link the accounts
pnpm run dev                 # http://localhost:3000, component catalogue at /design-system
```

Checks (all run in CI):

```
pnpm run type-check
pnpm run lint
pnpm test -- --run
pnpm run build
pnpm run check:ds            # raw HTML banned outside src/components/ui
pnpm run check:enforcement   # ENFORCEMENT.md rule -> enforcer table
pnpm run check:profile       # project-profile.json, Tailwind v4, .env.example placeholders
pnpm run check:file-length   # no source file over 250 lines
pnpm run check:api-messages  # API response messages come from src/content
pnpm run lint:content -- --strict  # copy records in src/content
pnpm run spellcheck
pnpm exec playwright test    # e2e and axe accessibility tests
pnpm run test:visual         # screenshot comparison inside Docker (see e2e/README.md)
```

`CLAUDE.md` and `ENFORCEMENT.md` describe the layout and the rules, and `project-profile.json` records which
standards modules are in place.

## Rules

- Never commit API keys, passwords, tokens, or real user email content.
  Use environment variables and a local `.env` file (git-ignored).
- Use development and test accounts only.
