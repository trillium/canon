# Module: Linting

## Check

- [ ] `biome.json` exists at project root
- [ ] `@biomejs/biome` in devDependencies
- [ ] Rules include `recommended` preset
- [ ] A11y rules enabled (warn level minimum)
- [ ] Security rule `noDangerouslySetInnerHtml` set to `error`
- [ ] Import organization enabled via `assist`
- [ ] Formatter: double quotes, 2-space indent
- [ ] CSS support enabled with Tailwind directives
- [ ] `package.json` has `"lint": "biome check ."` script
- [ ] `package.json` has `"format": "biome check --write ."` script
- [ ] No `.eslintrc*`, `.eslintignore`, `.prettierrc*`, `.prettierignore` files
- [ ] No `eslint`, `prettier` in dependencies

## Apply

1. Copy `biome.json` from this module to project root
2. Run `pnpm add -D @biomejs/biome`
3. Add scripts to `package.json`:
   ```json
   "lint": "biome check .",
   "format": "biome check --write ."
   ```
4. Remove ESLint/Prettier configs: `.eslintrc*`, `.eslintignore`, `.prettierrc*`, `.prettierignore`
5. Run `pnpm remove eslint prettier` and any eslint/prettier plugins
6. Run `pnpm run format` to reformat codebase to biome style

## Conflicts

- If project has custom ESLint rules beyond recommended, list them for manual review — some may have no biome equivalent
- If project has editor-specific prettier config (`.editorconfig`), leave it — biome respects editorconfig
