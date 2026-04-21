# Module: Hooks

## Check

- [ ] `husky` in devDependencies
- [ ] `lint-staged` in devDependencies
- [ ] `.husky/pre-commit` exists and runs lint-staged
- [ ] `lint-staged` config runs `biome check --write` on staged files
- [ ] `lint-staged` config runs emoji guard (`check-no-emoji.mjs`) on `*.{ts,tsx}` files
- [ ] `package.json` has `"prepare": "husky"` script
- [ ] Pre-commit includes large file guard (250-line warning, configurable)
- [ ] `.husky/large-files-allowlist.txt` exists for legitimate large files
- [ ] Pre-commit includes lock file guard (rejects `package-lock.json`, `yarn.lock`, `bun.lockb`)

## Apply

1. Run `pnpm add -D husky lint-staged`
2. Run `pnpm exec husky init`
3. Copy `.husky/pre-commit` from this module
4. Add lint-staged config to `package.json`:
   ```json
   "lint-staged": {
     "*.{js,jsx,ts,tsx,json,css}": "biome check --write --no-errors-on-unmatched",
     "*.{ts,tsx}": "node scripts/check-no-emoji.mjs"
   }
   ```
5. Copy `scripts/check-no-emoji.mjs` from this module (or create it — see below).
   The script scans for raw emoji characters and fails if any are found.
   Use `lucide-react` SVG icons instead of raw emoji for cross-platform consistency.
6. Copy `.husky/large-files-allowlist.txt` from this module (add project-specific patterns as needed)
7. Ensure `"prepare": "husky"` is in `package.json` scripts

## Conflicts

- If project uses lefthook or simple-git-hooks, remove them first
- If project has existing husky hooks, merge canon's pre-commit with existing hooks rather than replacing
