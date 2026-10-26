# Scripts

Project checks and helpers. Run them through the `pnpm run` scripts in `package.json`, or directly with `bun scripts/<name>.ts`.

## File extension rule

- **`.ts`, run with Bun, is the default.** Everything here is TypeScript so the scripts are type-checked by `pnpm run type-check`, share helpers in `scripts/shared/` and per-check module folders, and read like the rest of the codebase. Bun is already required for the design-system checks, so there is no second runner.
- **`.sh` only where a shell script is genuinely simpler.** That means thin wrappers around other command-line tools: `next-migration.sh` (allocates migration numbers from git state), `tsc-staged.sh` (runs `tsc` on the staged files) and `visual.sh` (starts the pinned Playwright Docker image). Logic, parsing and anything with branches belongs in `.ts`.
- **No `.mjs` or `.js`.** Some scripts arrived as plain Node files and were converted to `.ts`.
- Config files keep the extension their tool requires (for example `postcss.config.mjs`).

## Layout

- One entry script per check at the top level, named for what it does, with its usage in the header comment. Entry names stay stable because hooks, CI and `package.json` call them.
- Code that grew beyond one concern lives in a folder next to its entry script, with one file per concern and an `index.ts` for the public surface: `design-system/` (the raw-HTML checker), `literals/` (the literal-text scan), `content/` (page and content-file discovery) and `shared/` (helpers used by more than one script).
- No file may exceed 250 lines (`pnpm run check:file-length`, enforced in CI). Meet the limit by splitting into focused modules in a folder, never by compressing lines, joining statements or removing comments and blank lines. Readability decides where a file splits.
