# Enforcement

Every binding rule names the mechanism that enforces it. `pnpm run check:enforcement` (pre-commit and CI) verifies that every named file exists and that no rule rests on `convention`, `review` or `audit` alone — those are defects, allowed only as dated exceptions that expire.

Kinds: `structure` (the mistake cannot be written), `lint`, `hook`, `ci`, `test` — then, as defects, `convention`, `review`, `audit`. Ladder and procedure: canon `modules/agent-guardrails/PROMOTE.md`.

| Rule | Kind | Enforcer | Exception |
|------|------|----------|-----------|
| Biome is the only linter and formatter; staged files are fixed on commit | hook | `package.json` (lint-staged), `biome.json` | - |
| Lint passes before merge | ci | `.github/workflows/ci.yml` | - |
| TypeScript strict; types check before merge | structure | `tsconfig.json`, `.github/workflows/ci.yml` | - |
| No `dangerouslySetInnerHTML`, no `target="_blank"` without `rel` | lint | `biome.json` | - |
| No literal user-visible text in components | lint | `scripts/lint-literals.mjs`, `biome.json` | - |
| Copy records are well-formed and tagged `data-content` | lint | `scripts/lint-content.mjs` | - |
| Agents never accept content; accepting needs a human admin session | structure | `src/lib/require-admin.ts` | - |
| No raw HTML elements outside `components/ui` | hook | `scripts/check-design-system.ts`, `.claude/settings.json` | - |
| The design-system gate rejects a raw `<div>` commit | test | `src/test/design-system-enforcement.test.ts` | - |
| Every `components/ui` primitive has a manifest entry | lint | `scripts/check-ds-coverage.ts` | - |
| No raw emoji in source; use lucide-react | hook | `scripts/check-no-emoji.mjs` | - |
| Commit messages follow `type(scope): description` | hook | `.husky/commit-msg` | - |
| No direct pushes to `main` or `master` | hook | `.husky/pre-push` | - |
| pnpm is the only package manager; no foreign lock files | hook | `.husky/pre-commit` | - |
| Next.js 16: `proxy.ts`, never `middleware.ts` | hook | `.husky/pre-commit` | - |
| Prose and identifiers are spell-checked | lint | `cspell.json` | - |
| Every rule above has an enforcer that exists; no exception has expired | ci | `scripts/check-enforcement.mjs`, `.github/workflows/ci.yml` | - |
