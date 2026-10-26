# Enforcement

Every binding rule names the mechanism that enforces it. `pnpm run check:enforcement` (pre-commit and CI) verifies that every named file exists and that no rule rests on `convention`, `review` or `audit` alone — those are defects, allowed only as dated exceptions that expire.

Kinds: `structure` (the mistake cannot be written), `lint`, `hook`, `ci`, `test` — then, as defects, `convention`, `review`, `audit`.

| Rule | Kind | Enforcer | Exception |
|------|------|----------|-----------|
| Biome is the only linter and formatter; staged files are fixed on commit | hook | `package.json` (lint-staged), `biome.json` | - |
| Lint passes before merge | ci | `.github/workflows/ci.yml` | - |
| TypeScript strict; types check before merge | structure | `tsconfig.json`, `.github/workflows/ci.yml` | - |
| No `dangerouslySetInnerHTML`, no `target="_blank"` without `rel` | lint | `biome.json` | - |
| No literal user-visible text in components | lint | `scripts/lint-literals.ts`, `biome.json` | - |
| Copy records are well-formed and tagged `data-content` | ci | `scripts/lint-content.ts`, `.github/workflows/ci.yml` | - |
| Agents never accept content; accepting needs a human admin session | structure | `src/lib/require-admin.ts` | - |
| No raw HTML elements outside `components/ui` | hook | `scripts/check-design-system.ts`, `.claude/settings.json` | - |
| The design-system gate rejects a raw `<div>` commit | test | `src/test/design-system-enforcement.test.ts` | - |
| Every `components/ui` primitive has a manifest entry | lint | `scripts/check-ds-coverage.ts` | - |
| No raw emoji in source; use lucide-react | hook | `scripts/check-no-emoji.ts` | - |
| Commit messages follow `type(scope): description` | hook | `.husky/commit-msg` | - |
| No direct pushes to `main` or `master` | hook | `.husky/pre-push` | - |
| pnpm is the only package manager; no foreign lock files | hook | `.husky/pre-commit` | - |
| Next.js 16: `proxy.ts`, never `middleware.ts` | hook | `.husky/pre-commit` | - |
| Prose and identifiers are spell-checked | ci | `cspell.json`, `.github/workflows/ci.yml` | - |
| Every standards module is classified in `project-profile.json` with a status and a reason | ci | `scripts/check-project-profile.ts`, `.github/workflows/ci.yml` | - |
| Tailwind CSS v4 is the styling system (`tailwindcss` 4, `@tailwindcss/postcss`, `@import "tailwindcss"`) | ci | `scripts/check-project-profile.ts`, `.github/workflows/ci.yml` | - |
| Every design-system preset stays enabled, so raw HTML is banned outside `components/ui` | ci | `scripts/check-project-profile.ts`, `src/components/ui/manifest.config.ts` | - |
| `.env.example` holds placeholders only; real env files are untracked | ci | `scripts/check-project-profile.ts`, `.gitignore` | - |
| The profile check rejects an unreasoned module, Tailwind below v4, a disabled preset, a value in `.env.example` and a non-TypeScript script | test | `src/test/check-project-profile.test.ts` | - |
| `/` and `/design-system` have no axe-core accessibility violations | test | `e2e/smoke.spec.ts`, `.github/workflows/accessibility.yml` | - |
| No source file over 250 lines; long files are split into modules | ci | `scripts/check-file-length.ts`, `.github/workflows/ci.yml` | - |
| The file length guard rejects a file over the limit and exempts tests and allowlisted files | test | `src/test/check-file-length.test.ts` | - |
| Server response messages come from JSON files in `src/content`, not inline text in routes | ci | `scripts/check-api-messages.ts`, `.github/workflows/ci.yml` | - |
| The API message guard rejects inline response text and accepts content-file messages | test | `src/test/check-api-messages.test.ts` | - |
| Scripts are TypeScript run with Bun (`.sh` only for shell wrappers); no `.mjs` or `.js` | ci | `scripts/check-project-profile.ts`, `scripts/README.md` | - |
| Every page has a committed visual baseline; a visual diff fails the pull request | ci | `e2e/visual.spec.ts`, `.github/workflows/visual.yml` | - |
| Visual baselines are made in the Playwright image pinned to the exact `@playwright/test` version | ci | `scripts/check-project-profile.ts`, `.github/workflows/visual.yml` | - |
| Every rule above has an enforcer that exists; no exception has expired | ci | `scripts/check-enforcement.ts`, `.github/workflows/ci.yml` | - |
