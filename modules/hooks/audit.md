# Module: Hooks

## Check

- [ ] `husky` in devDependencies
- [ ] `lint-staged` in devDependencies
- [ ] `.husky/pre-commit` exists and runs lint-staged
- [ ] `lint-staged` config runs `biome check --write` on staged files
- [ ] `package.json` has `"prepare": "husky"` script

## Apply

1. Run `pnpm add -D husky lint-staged`
2. Run `pnpm exec husky init`
3. Copy `.husky/pre-commit` from this module
4. Add lint-staged config to `package.json`:
   ```json
   "lint-staged": {
     "*.{js,jsx,ts,tsx,json,css}": "biome check --write --no-errors-on-unmatched"
   }
   ```
5. Ensure `"prepare": "husky"` is in `package.json` scripts

## Conflicts

- If project uses lefthook or simple-git-hooks, remove them first
- If project has existing husky hooks, merge canon's pre-commit with existing hooks rather than replacing
