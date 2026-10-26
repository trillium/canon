# Scripts

Project checks and helpers. Run them through the `pnpm run` scripts in `package.json`, or directly with `bun scripts/<name>.ts`.

## File extension rule

- **`.ts`, run with Bun, is the default.** Everything here is TypeScript so the scripts are type-checked by `pnpm run type-check`, share helpers in `scripts/lib/`, and read like the rest of the codebase. Bun is already required for the design-system checks, so there is no second runner.
- **`.sh` only where a shell script is genuinely simpler.** That means thin wrappers around other command-line tools: `next-migration.sh` (allocates migration numbers from git state), `tsc-staged.sh` (runs `tsc` on the staged files) and `visual.sh` (starts the pinned Playwright Docker image). Logic, parsing and anything with branches belongs in `.ts`.
- **No `.mjs` or `.js`.** Some scripts arrived as plain Node files and were converted to `.ts`.
- Config files keep the extension their tool requires (for example `postcss.config.mjs`).

## Layout

- One script per check at the top level, with the usage in its header comment.
- Shared code lives in `scripts/lib/`.
- No file may exceed 250 lines (`pnpm run check:file-length`, enforced in CI). Split a long script into modules in `scripts/lib/`.
