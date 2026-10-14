# Module: Design System

Raw HTML elements are banned outside `components/ui/`. A manifest lists each banned element and the component that replaces it; four layers enforce it (Claude Code hook, lint-staged, pre-push, CI) and a `/design-system` page keeps the replacements discoverable.

Layout: files below use the `src/` layout. In a project whose `components/` and `app/` sit at the repo root, drop the `src/` prefix — the scripts auto-detect `src/components/ui` or `components/ui` (override with `DS_UI_DIR`).

## Check

- [ ] `src/components/ui/manifest.ts` exists and is identical to this module's copy (generic — never edited per project)
- [ ] `src/components/ui/manifest.config.ts` exists (the per-project file: `ENABLED_RULES`, `PRESET_OVERRIDES`, `CUSTOM_RULES`)
- [ ] `scripts/check-design-system.ts`, `scripts/check-ds-coverage.ts` and `scripts/check-ds-page.ts` exist and are identical to this module's copies
- [ ] `src/app/design-system/page.tsx` exists and serves `/design-system`
- [ ] The page has all eight sections, each an element with the id shown (`bun scripts/check-ds-page.ts` enforces the ids and that every manifest component is named):
  - [ ] **Principles** (`ds-principles`) — the rules that settle design arguments
  - [ ] **Foundations** (`ds-foundations`) — color, type scale, spacing/grid, radius, elevation, motion, iconography
  - [ ] **Tokens** (`ds-tokens`) — semantic names with light and dark values
  - [ ] **Components** (`ds-components`) — per component: name, description, props/variants, states, usage do/don't, code example, live demo
  - [ ] **Patterns** (`ds-patterns`) — layouts and flows built from the components
  - [ ] **Content guidelines** (`ds-content`) — voice, tone, microcopy
  - [ ] **Accessibility** (`ds-accessibility`) — contrast, focus, motion
  - [ ] **Governance** (`ds-governance`) — add/change process, opt-out directives, enforcement rules table (rendered from the manifest), owner
- [ ] Enforcement blocks rather than warns: the pre-commit hook exits non-zero on a violation, pre-push re-runs the full sweep, the CI `design-system` job fails the PR (this catches `git commit --no-verify`), and hooks install automatically through `"prepare": "husky"` on `pnpm install` / `bun install`
- [ ] `src/test/design-system-enforcement.test.ts` exists, is identical to this module's copy, and passes — it proves a commit with a raw `<div>` is rejected
- [ ] The `test` job in `ci.yml` has `oven-sh/setup-bun` (the enforcement test shells out to `bun`)
- [ ] `package.json` has a `check:ds` script running all three scripts
- [ ] `lint-staged` runs `bun scripts/check-design-system.ts --staged-only` on `*.{jsx,tsx}`
- [ ] `lint-staged` runs `check-ds-coverage.ts` and `check-ds-page.ts` on `src/components/ui/**`, and `check-ds-page.ts` on `src/app/design-system/**`
- [ ] `.husky/pre-push` runs `pnpm run check:ds` after the protected-branch guard (skipped in CI, warns when `bun` is missing)
- [ ] `.github/workflows/ci.yml` has a `design-system` job running `pnpm run check:ds` (with `oven-sh/setup-bun`)
- [ ] `.claude/settings.json` has the `PreToolUse` hook for `Write|Edit|MultiEdit` running `check-design-system.ts --claude-hook`
- [ ] Every primitive in `src/components/ui/*.tsx` has a manifest entry (`bun scripts/check-ds-coverage.ts` passes)
- [ ] `bun scripts/check-design-system.ts --all` passes — no raw-tag violations outside `components/ui` (legacy violations carry `ds-ignore` directives, see Conflicts)

## Apply

1. Copy `src/components/ui/manifest.ts` and `src/components/ui/manifest.config.ts` from this module to the project.
2. Copy `scripts/check-design-system.ts`, `scripts/check-ds-coverage.ts` and `scripts/check-ds-page.ts` from this module.
3. Copy `src/app/design-system/page.tsx` and replace each TODO section with the project's real content: swatches and the type scale under Foundations, semantic tokens with light/dark values under Tokens, and a live example of every manifest component under Components.
3a. Copy `src/test/design-system-enforcement.test.ts` and add `oven-sh/setup-bun` to the `test` job in `ci.yml`.
4. Add the scripts and lint-staged entries to `package.json` (merge into the existing arrays — see the hooks module):
   ```json
   "scripts": {
     "check:ds": "bun scripts/check-design-system.ts --all && bun scripts/check-ds-coverage.ts && bun scripts/check-ds-page.ts"
   },
   "lint-staged": {
     "*.{jsx,tsx}": "bun scripts/check-design-system.ts --staged-only",
     "src/components/ui/**": ["bun scripts/check-ds-coverage.ts", "bun scripts/check-ds-page.ts"],
     "src/app/design-system/**": "bun scripts/check-ds-page.ts"
   }
   ```
5. Append the design-system guard from this repo's `modules/hooks/pre-push` to `.husky/pre-push`.
6. Add the `design-system` job from `modules/ci/.github/workflows/ci.yml` to `.github/workflows/ci.yml`.
7. Copy `.claude/settings.json` to the project, or merge its `PreToolUse` entry into the existing `hooks` block:
   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Write|Edit|MultiEdit",
           "hooks": [
             {
               "type": "command",
               "command": "bun \"$CLAUDE_PROJECT_DIR/scripts/check-design-system.ts\" --claude-hook"
             }
           ]
         }
       ]
     }
   }
   ```
   The hook exits `2` when the content being written introduces a raw tag outside `components/ui`, which blocks the tool call and feeds the message back to the agent. Lines already present in the file are not flagged, so editing legacy code stays possible.
8. Install `bun` if missing (`brew install oven-sh/bun/bun`) — the scripts are TypeScript run directly by bun.
9. Build the components, then turn enforcement on one rule at a time: add the primitive to `components/ui/`, add its preset name to `ENABLED_RULES` in `manifest.config.ts` (presets live in `manifest.ts`: `raw-input`, `raw-textarea`, `raw-select`, `raw-button`, `raw-label`, `raw-heading`, `raw-p`, `raw-span`, `raw-code`, `raw-anchor`, `raw-div`, `raw-stack`), add a live example to `/design-system`, then migrate call sites. Run `bun scripts/check-design-system.ts --all` to list what remains.
10. Re-run the Check section.

### Opt-out directives

| Directive | Scope | Effect |
|-----------|-------|--------|
| `// ds-ignore` | Findings within 3 lines | Skips design-system rules |
| `{/* ds-ignore */}` | Same, inside JSX | Skips design-system rules |
| `/* ds-ignore-file */` | Whole file | Skips all design-system rules (OG image routes, the catalogue page, the manifest) |

Rules with `noEscapeHatch: true` ignore all three.

### What a design system contains

A design system is the shared vocabulary of a product: principles, the visual foundations built into tokens, the components assembled from them, the patterns that combine components, the content rules for the words, the accessibility floor, and the governance that keeps it all from drifting. Sources: [Design Systems 101](https://www.nngroup.com/articles/design-systems-101/) (Nielsen Norman Group), [designsystems.com](https://www.designsystems.com/). The `/design-system` page is where all of it lives, in the eight sections listed under Check.

## Conflicts

- **Existing codebase full of raw tags** — do not enable every preset at once. Enable one, migrate (a codemod or parallel agents per directory work well), then enable the next. Where migration is not worth it, mark the line `// ds-ignore` rather than leaving the rule off.
- **Components already exist under other names or paths** — keep them; set `importPath` and `component` in `PRESET_OVERRIDES` (for example `{ "raw-anchor": { importPath: "@/components/Link" } }`) instead of renaming.
- **Project already has shadcn/ui primitives in `components/ui/`** — they count as primitives and need manifest entries. Register ones with nothing to ban as custom rules with `patterns: []`.
- **No `src/` directory** — use the root layout (`components/ui`, `app/design-system`); the scripts detect it.
- **Existing `.claude/settings.json`** — merge the `PreToolUse` entry; do not replace the file.
- **Project is not React** — `.tsx`/`.jsx` only are scanned; the module does not apply.
