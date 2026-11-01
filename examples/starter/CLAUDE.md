# Project Instructions

Next.js 16 (App Router) + React 19 + TypeScript strict, Supabase, Tailwind 4, Biome. Bun runtime, pnpm packages.

## Commands

- `pnpm run type-check` — `tsc --noEmit`
- `pnpm run lint` — Biome (the only linter and formatter; no ESLint, no Prettier)
- `pnpm test -- --run` — Vitest
- `pnpm run test:e2e` — Playwright (`@a11y` tests run axe-core)
- `pnpm run build` — `next build`
- `pnpm run check:enforcement` — the rule -> enforcer table (below)

## Layout

`src/app` routes, `src/components` shared components (`components/ui` is the design system), `src/providers`, `src/lib`, `src/types`, `supabase/migrations`. Server-side work goes through Supabase; validate API input with Zod.

## Enforcement

@ENFORCEMENT.md

Every binding rule in this project is enforced by a mechanism, named in `ENFORCEMENT.md`. The hooks and CI jobs there are the rules — do not work around them (`--no-verify`, `// ds-ignore` without a reason). A rule whose only enforcer is `convention`, `review` or `audit` is a defect: fix it by building the enforcer.

## When corrected

When you are corrected, do not add a sentence to this file. Fix the class of mistake at the highest rung that works — code structure, then lint / hook / test / CI, and only then prose — and add a row to `ENFORCEMENT.md`.

## Project

Canon Starter: a minimal Next.js app with every Canon standards module applied and its checks passing. It is meant to be copied and renamed, then built on. It holds the UI only and builds against mock data; it contains no backend logic or real user data.

- The full UI is built from components in `src/components/ui`; `/design-system` is the catalogue. Tailwind CSS v4.
- Copy lives in JSON under `src/content`; humans accept it, agents never do.
- Standards module status, and the reason for each, is in `project-profile.json`.
- No hosting, database, email, payment or error-tracking account is linked. `.env.example` lists the variables, all empty. Use development and test accounts only, and never commit keys, passwords, tokens or real user email content.
