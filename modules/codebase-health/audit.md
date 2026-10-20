# Module: Codebase Health

## Check

- [ ] `fallow` in devDependencies
- [ ] `.fallowrc.json` exists at project root
- [ ] Config includes source paths (`src/`, `app/`, etc.)
- [ ] Config excludes test files, node_modules, build artifacts (`.next`, `dist`, `build`)
- [ ] `circularDeps` set to `error` level
- [ ] `boundaryViolations` set to `error` level
- [ ] Dead code rules (`unusedFiles`, `unusedExports`, `unusedDeps`) at `warn` or stricter
- [ ] Duplication threshold set (default 8%)
- [ ] Duplication mode set to `semantic`
- [ ] `package.json` has `"health"` script running `fallow`
- [ ] `package.json` has `"health:audit"` script running `fallow audit --changed-since main --format json`
- [ ] `package.json` has `"health:fix"` script running `fallow fix --dry-run`
- [ ] `.github/workflows/codebase-health.yml` exists
- [ ] CI workflow runs `pnpm run health:audit` on pull requests
- [ ] CI workflow uses `fetch-depth: 0` for `--changed-since` support
- [ ] CI workflow uploads SARIF results
- [ ] Pre-push hook includes fallow check with graceful degradation
- [ ] `scripts/fallow-prepush.sh` exists and is executable
- [ ] No Knip configuration remaining (migrated to Fallow)
- [ ] (Optional) `fallow-mcp` configured for agent access

## Apply

1. Run `pnpm add -D fallow`
2. Copy `.fallowrc.json` from this module to the project root
3. Add scripts to `package.json`:
   ```json
   "health": "fallow",
   "health:audit": "fallow audit --changed-since main --format json",
   "health:fix": "fallow fix --dry-run"
   ```
4. Copy `scripts/fallow-prepush.sh` from this module and make it executable:
   ```sh
   chmod +x scripts/fallow-prepush.sh
   ```
5. Add fallow block to `.husky/pre-push` (after the branch protection guard):
   ```sh
   # --- Codebase health check ---
   bash scripts/fallow-prepush.sh
   ```
6. Copy `.github/workflows/codebase-health.yml` from this module
7. Run `pnpm run health` to establish baseline and verify config
8. If Knip is present: run `fallow migrate`, verify output, then remove Knip config and deps:
   ```sh
   pnpm exec fallow migrate --dry-run
   pnpm exec fallow migrate
   pnpm remove knip
   rm -f .kniprc* knip.json knip.config.*
   ```
9. (Optional) Configure `fallow-mcp` for agent access in `.mcp.json`:
    ```json
    {
      "mcpServers": {
        "fallow": {
          "command": "npx",
          "args": ["fallow", "mcp"]
        }
      }
    }
    ```

## Conflicts

- If project uses Knip: run `fallow migrate` to convert config, then remove Knip deps and config files
- If project has custom dead code scripts: Fallow likely supersedes — review and remove
- If pre-push hook already has custom checks: merge the fallow block rather than replacing
- The code-review module (#32) can consume `fallow audit` output as deterministic evidence — these modules are complementary, not conflicting
