# Module: CI

## Check

- [ ] `.github/workflows/` directory exists
- [ ] CI workflow runs on pull requests
- [ ] Job: type-check (`tsc --noEmit`)
- [ ] Job: lint (`biome check .`)
- [ ] Job: unit tests (`vitest run`)
- [ ] Job: build (`next build`)
- [ ] Job: a11y (axe-core via Playwright)
- [ ] All jobs run in parallel

## Apply

1. Create `.github/workflows/` if it doesn't exist
2. Copy `ci.yml` from this module's `.github/workflows/`
3. Add type-check script to `package.json` if missing:
   ```json
   "type-check": "tsc --noEmit"
   ```

## Conflicts

- If project has existing CI workflows, merge canon's jobs into them rather than replacing
- If project uses a different CI provider (GitLab CI, CircleCI), adapt the workflow — the jobs are the same, only the syntax changes
