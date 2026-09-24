# Module: Design System

Commit-blocking component reuse-first gate. Pages compose design-system
primitives; they never hand-roll raw UI. Two scripts enforce it at the
commit boundary, driven by a single rule registry.

## Check

- [ ] `src/components/ui/manifest.ts` exists and exports `DS_RULES`
      (`DsRule[]`) and `DS_COMPONENT_NAMES`
- [ ] Every `DS_RULES` entry has `name`, `component`, `importPath`,
      `description`, `rawPattern`, and at least one `patterns` entry
- [ ] Every rule target exists in `DS_COMPONENTS_BY_CATEGORY`
- [ ] `scripts/check-design-system.ts` loads `DS_RULES` from the manifest —
      no hardcoded rule arrays (resolved from `process.cwd()`, never `@/`)
- [ ] `scripts/check-ds-coverage.ts` exists and fails when a
      `src/components/ui/*.tsx` file is not imported in the catalogue
- [ ] `package.json` has `check:ds` and `check:ds-coverage` scripts
- [ ] `lint-staged` runs `check-design-system.ts` on `*.{ts,tsx}`
- [ ] `lint-staged` runs `check-ds-coverage.ts` on `src/components/ui/*.tsx`
- [ ] Pre-commit verifies catalogue coverage when `src/components/ui/`
      files are staged
- [ ] CI runs `check:ds` and `check:ds-coverage` (design-system job)
- [ ] `src/app/design-system/page.tsx` renders every `ui/` component plus
      an enforcement table derived from `DS_RULES` (not a hardcoded copy)
- [ ] Staging a file with a raw pattern fails the hook naming the DS
      component to use instead
- [ ] `// ds-ignore` suppresses one line; `/* ds-ignore-file */`
      suppresses a file; both log the suppression to stderr

## Apply

1. Copy `manifest.ts` from this module to `src/components/ui/manifest.ts`
2. Copy `scripts/check-design-system.ts` and
   `scripts/check-ds-coverage.ts` from this module to `scripts/` (verbatim —
   they resolve the manifest from `process.cwd()`, so the module copy and
   the project copy stay byte-identical)
3. Add a starter `src/components/ui/` set (button, input, badge, card —
   see `template/`), each file carrying `/* ds-ignore-file */` so rules
   never block a component's own implementation
4. Add the catalogue at `src/app/design-system/page.tsx` rendering every
   `ui/` component with variants, plus an enforcement section mapped from
   `DS_RULES`
5. Add scripts to `package.json` (Node 22.18+ required for type stripping):
   ```json
   "check:ds": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-design-system.ts src",
   "check:ds-coverage": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-ds-coverage.ts"
   ```
6. Wire `lint-staged` in `package.json`:
   ```json
   "*.{ts,tsx}": ["node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-design-system.ts"],
   "src/components/ui/*.tsx": ["node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-ds-coverage.ts"]
   ```
   (merge with the hooks module entries — do not replace them)
7. Add the design-system coverage block to `.husky/pre-commit` (see the
   hooks module) and the design-system job to CI (see the ci module)
8. Verify: stage a scratch file with a raw `<button className="bg-primary…">`
   and confirm the commit fails naming `<Button>`; add an uncovered `ui/`
   file and confirm `check-ds-coverage.ts` fails; confirm `// ds-ignore`
   passes

## Conflicts

- If the project uses Bun, the scripts still run (`node` is the floor) —
  swap the runner only if the project has no Node
- If the project already has a `ui/` library (shadcn, MUI), register its
  components in the manifest instead of replacing them — the gate is
  reuse-first, not rewrite-first
- If Node is older than 22.18, type stripping is unavailable — either
  upgrade Node or run the scripts through the project's TS runner
- New `ui/` files fail coverage until added to the catalogue — that is the
  point, not a conflict: catalogue the component in the same commit
