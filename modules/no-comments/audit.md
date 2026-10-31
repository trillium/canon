# Module: No Comments (opt-in)

Code comments are banned. Agents copy them, they go stale, and nothing enforces them. Intent belongs in names, types, tests, lint rules and API design. `check:comments` fails on any comment that is not a tool directive, a license header, or a citation of an external fact. Existing comments sit on a shrinking allow-list.

Allowed without an allow-list entry:

- Tool directives: `@vitest-environment`, `biome-ignore`, `eslint-disable` / `eslint-enable`, `@ts-expect-error` / `@ts-ignore` / `@ts-nocheck` / `@ts-check`, `/// <reference`, `ds-ignore`, `istanbul ignore`, `c8 ignore`, `prettier-ignore`
- License headers: `/*!`, `@license`, `@preserve`, `Copyright`, `SPDX-License-Identifier`
- External facts: a comment containing an RFC number (`RFC 9110`) or an `http(s)://` URL
- SQL: `comment on ...` statements (they are statements, not comments), and a header comment before the first statement that names a ticket (`PROJ-123`, `#45`) or a spec

## Check

- [ ] `scripts/check-comments.ts` exists and is byte-identical to this module's copy
- [ ] `typescript` is in devDependencies (the scanner uses `ts.forEachLeadingCommentRange`)
- [ ] `no-comments.config.json` exists at the project root with `dirs`, `exclude` and `baseline`
- [ ] `.no-comments-baseline.json` exists and is committed
- [ ] `package.json` has a `"check:comments"` script running `bun scripts/check-comments.ts`
- [ ] lint-staged runs `bun scripts/check-comments.ts` on staged `*.{ts,tsx,js,jsx,mjs,cjs,sql}`
- [ ] `.github/workflows/no-comments.yml` exists and runs `pnpm run check:comments` (with `oven-sh/setup-bun`)
- [ ] `src/test/check-comments.test.ts` exists, is byte-identical to this module's copy, and passes
- [ ] The agent instruction file has the no-comments line from `modules/agent-guardrails/CLAUDE.template.md`
- [ ] `ENFORCEMENT.md` has the no-comments row
- [ ] `pnpm run check:comments` exits 0

## Apply

1. Run `pnpm add -D typescript` if it is missing.
2. Copy `scripts/check-comments.ts`, `no-comments.config.json` and `src/test/check-comments.test.ts` from this module. Set `dirs` to the project's source directories; list generated files (for example `src/types/database.ts`) under `exclude`.
3. Add to `package.json`:
   ```json
   "scripts": {
     "check:comments": "bun scripts/check-comments.ts"
   },
   "lint-staged": {
     "*.{ts,tsx,js,jsx,mjs,cjs,sql}": "bun scripts/check-comments.ts"
   }
   ```
   (merge into the existing blocks - see the hooks module)
4. Copy `.github/workflows/no-comments.yml`.
5. Run `pnpm run check:comments -- --baseline`. In a fresh project the allow-list stays empty. In an existing project it records every current comment per file; commit it.
6. Add the no-comments row to `ENFORCEMENT.md` and the no-comments line to the agent instruction file.
7. Run `pnpm run check:comments`; it must exit 0. Then run the conformity sweep below.

Conformity sweep: for each file on the allow-list, delete the comments, moving intent into a name, a type or a test, then run `pnpm run check:comments -- --baseline` to lower the count. The baseline refuses to grow or add files. The check also fails when a count has dropped below its allow-list entry, so the ratchet is committed with the deletion.

## Conflicts

- A project with ESLint rules such as `no-warning-comments` or `spaced-comment`: Canon bans ESLint; remove them with the linter migration
- Generated files that carry comments (`gen:types` output): list them in `exclude`, do not baseline them
- Files copied verbatim from canon modules that still carry comments: `exclude` them until the module is swept, rather than baselining them
- Documentation comments that a tool consumes (for example OpenAPI or TypeDoc input): if the tool is in use, keep the comment and cite the URL of its format; otherwise delete it
- A project that already has a comment lint: keep one enforcer; prefer this check because it has the allow-list ratchet
