# Canon Enforcement

Canon's own rule -> enforcer table: each rule of `CANON.md` and `CLAUDE.md`, and the mechanism that enforces it. `node modules/agent-guardrails/scripts/check-enforcement.mjs --table-only` verifies it in CI (`.github/workflows/conformance.yml`): every named file must exist, and no rule may rest on `convention`, `review` or `audit` alone.

A rule whose only enforcer is `convention`, `review` or `audit` is a **defect**. It is allowed only as an exception with an expiry date and a reason; when the date passes the check fails until someone builds the enforcer or renews the exception with a reason. The ladder and the procedure for closing a defect: [modules/agent-guardrails/PROMOTE.md](modules/agent-guardrails/PROMOTE.md).

Kinds: `structure` (the mistake cannot be written), `lint`, `hook`, `ci`, `test` — then, as defects, `convention`, `review`, `audit` (an agent or human re-reading an `audit.md` checklist).

## What the template enforces

| Rule | Kind | Enforcer | Exception |
|------|------|----------|-----------|
| Biome config matches the linting module (rules, security errors, double quotes) | ci | `.github/workflows/conformance.yml`, `modules/linting/biome.json` | - |
| Biome on staged files, no emoji, tsc on staged files, no foreign lock files, `proxy.ts` not `middleware.ts` | hook | `modules/hooks/pre-commit` | - |
| Conventional commits in projects | hook | `modules/hooks/commit-msg` | - |
| No direct pushes to `main` in projects | hook | `modules/hooks/pre-push` | - |
| CI jobs: type-check, lint, unit tests, build, design system, a11y, e2e | ci | `modules/ci/.github/workflows/ci.yml`, `modules/ci/.github/workflows/e2e.yml` | - |
| Vitest and Playwright configs match the testing module | ci | `.github/workflows/conformance.yml`, `modules/testing/vitest.config.ts` | - |
| Raw HTML elements banned outside `components/ui` | hook | `modules/design-system/scripts/check-design-system.ts`, `modules/design-system/.claude/settings.json` | - |
| Every `components/ui` primitive has a manifest entry; the catalogue page lists them | lint | `modules/design-system/scripts/check-ds-coverage.ts`, `modules/design-system/scripts/check-ds-page.ts` | - |
| Design-system enforcement blocks a raw `<div>` commit | test | `modules/design-system/src/test/design-system-enforcement.test.ts` | - |
| Components contain no literal user-visible text | lint | `modules/content-acceptance/scripts/lint-literals.mjs` | - |
| Copy fields are tagged `data-content` or `data-content-skip` | lint | `modules/content-acceptance/scripts/lint-content.mjs` | - |
| Agents may never accept copy; only a human admin session can | structure | `modules/content-acceptance/lib/require-admin.ts` | - |
| Acceptance records are keyed to a content hash; edits invalidate | structure | `modules/content-acceptance/lib/content-acceptance.ts` | - |
| Prose is spell-checked | lint | `modules/spellcheck/cspell.json` | - |
| Migration numbers are allocated, not hand-picked | structure | `modules/migration-allocator/next-migration.sh` | - |
| The template has an agent instruction file that points at its enforcement table | ci | `modules/agent-guardrails/scripts/check-enforcement.mjs`, `template/ENFORCEMENT.md` | - |

## What Canon enforces on itself

| Rule | Kind | Enforcer | Exception |
|------|------|----------|-----------|
| The template conforms to every module's config files | ci | `.github/workflows/conformance.yml` | - |
| The template builds, type-checks, lints and passes its tests | ci | `.github/workflows/conformance.yml` | - |
| Every module has an `audit.md` with Check, Apply and Conflicts sections | ci | `.github/workflows/conformance.yml` | - |
| This table is honest: enforcers exist, no exception has expired | ci | `modules/agent-guardrails/scripts/check-enforcement.mjs` | - |
| Commit messages use `type(module): description` in this repo | convention | `CLAUDE.md` | 2027-04-30 canon has no commit-msg hook of its own; add one or a PR-title check |

## Defects in the spec itself

Rules `CANON.md` states that today rest on an agent running a module's `audit.md` Check, or on nothing at all. None is enforced mechanically in a project; each is a candidate for a lint, a test or a CI step.

| Rule | Kind | Enforcer | Exception |
|------|------|----------|-----------|
| No ESLint, no Prettier | audit | `modules/linting/audit.md` | 2027-04-30 a dependency or config-file check would settle it |
| Supabase Auth SSR pattern, proxy-based session refresh | audit | `modules/auth/audit.md` | 2027-04-30 only the template's own code shows the pattern |
| Zod validation and rate limiting at API boundaries | audit | `modules/feedtack/audit.md` | 2027-04-30 audited for the feedtack route only; a route lint could require a schema parse |
| Tailwind 4, shadcn, CVA, lucide as the styling stack | audit | `modules/styling/audit.md` | 2027-04-30 audit-only |
| Email, analytics and error-tracking providers (Resend, PostHog, Sentry) | audit | `modules/email/audit.md` | 2027-04-30 audit-only |
| Bun is the runtime | convention | `CANON.md` | 2027-04-30 only the design-system scripts need bun, and nothing checks the rest |
| Row Level Security on every table | convention | `CANON.md` | 2027-04-30 audited for feedtack_submissions only; a migration lint can reject create table without row level security |
| Zustand for client state, no Redux | convention | `CANON.md` | 2027-04-30 a restricted-imports Biome rule would settle it |
| Source layout under `src/` | convention | `CANON.md` | 2027-04-30 no module checks the directory layout |
| Deploy on Vercel with preview deploys | review | `CANON.md` | 2027-04-30 configured in the Vercel dashboard, not in the repo |
