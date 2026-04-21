# Module: CI

## Check

- [ ] `.github/workflows/` directory exists
- [ ] `ci.yml` — fast-feedback workflow on pull requests
  - [ ] Job: type-check (`tsc --noEmit`)
  - [ ] Job: lint (`biome check .`)
  - [ ] Job: unit tests (`vitest run`)
  - [ ] Job: build (`next build`)
  - [ ] All jobs run in parallel
- [ ] `accessibility.yml` — a11y workflow on pull requests
  - [ ] Job: axe-core via Playwright (`--grep @a11y`)
- [ ] `e2e.yml` — end-to-end workflow on pull requests
  - [ ] Job: Playwright e2e tests (`--grep-invert @a11y`)

## Why three workflows

- **Different timeouts** — Playwright tests are slower and may need longer timeouts without affecting the fast-feedback lint/type-check/build gate
- **Independent failure policies** — a flaky e2e test shouldn't block the core CI signal
- **Clearer GitHub status checks** — reviewers can see at a glance which category failed
- **Easier to re-run** — can retry just the e2e workflow without re-running lint/build

## Apply

1. Create `.github/workflows/` if it doesn't exist
2. Copy `ci.yml`, `accessibility.yml`, and `e2e.yml` from this module's `.github/workflows/`
3. Add type-check script to `package.json` if missing:
   ```json
   "type-check": "tsc --noEmit"
   ```

## Conflicts

- If project has existing CI workflows, merge canon's jobs into them rather than replacing
- If project uses a different CI provider (GitLab CI, CircleCI), adapt the workflow — the jobs are the same, only the syntax changes
