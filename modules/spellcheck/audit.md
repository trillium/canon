# Module: Spellcheck

## Check

- [ ] `cspell` in devDependencies
- [ ] `cspell.json` exists at project root with appropriate dictionaries and ignore patterns
- [ ] `.cspell/project-words.txt` exists for project-specific terms
- [ ] `package.json` has a `"spellcheck"` script
- [ ] lint-staged runs cspell on staged `*.{md,mdx}` files

## Apply

1. Run `pnpm add -D cspell`
2. Copy `cspell.json` from this module to the project root
3. Copy `.cspell/project-words.txt` from this module (add project-specific terms as needed)
4. Add to `package.json` scripts:
   ```json
   "spellcheck": "cspell lint --no-must-find-files '**/*.{md,mdx,ts,tsx}'"
   ```
5. Add cspell to lint-staged config:
   ```json
   "*.{md,mdx}": "cspell lint --no-must-find-files"
   ```

## Conflicts

- If project uses a different spell checker (e.g. `spellchecker-cli`, `typos`), decide whether to keep both or migrate the custom dictionary into `.cspell/project-words.txt`
- If lint-staged already has a `*.md` rule, merge the cspell command into the existing array rather than replacing it
