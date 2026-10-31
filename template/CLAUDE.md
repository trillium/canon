# Project Instructions

Built on [canon](https://github.com/trillium/canon). Next.js 16 (App Router) + React 19 + TypeScript strict, Supabase, Tailwind 4, Biome. Bun runtime, pnpm packages.

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

Do not write comments. Encode intent in names, types and tests; `pnpm run check:comments` fails on any comment that is not a tool directive, a license header, or an RFC or URL citation.

## When corrected

When you are corrected, do not add a sentence to this file. Fix the class of mistake at the highest rung that works — code structure, then lint / hook / test / CI, and only then prose — and add a row to `ENFORCEMENT.md`. Procedure: canon `modules/agent-guardrails/PROMOTE.md`.

## Project

<!-- What this project is, domain terms, and rules specific to it. Each binding rule goes in ENFORCEMENT.md too. -->
