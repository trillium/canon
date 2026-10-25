# Module: Agent Guardrails

An agent that is corrected should not be answered with more prose. This module gives a project the three pieces that turn corrections into structure: an agent instruction file, a rule -> enforcer table that CI keeps honest, and a promotion step for corrections. The ladder behind it is in `CANON.md` ("Enforcement").

## Check

- [ ] `CLAUDE.md` (or `AGENTS.md`) exists at the project root and references `ENFORCEMENT.md`
- [ ] `ENFORCEMENT.md` exists at the project root with a `| Rule | Kind | Enforcer | Exception |` table
- [ ] Every row's kind is `structure`, `lint`, `hook`, `ci` or `test`, and its Enforcer names a file or `pnpm run` script that exists — or the row is a dated exception (kind `convention`, `review` or `audit` with an unexpired `YYYY-MM-DD reason`)
- [ ] No exception has expired (`node scripts/check-enforcement.mjs` exits 0)
- [ ] `scripts/check-enforcement.mjs` exists and is byte-identical to this module's copy
- [ ] `package.json` has a `"check:enforcement"` script running `node scripts/check-enforcement.mjs`
- [ ] `lint-staged` runs `node scripts/check-enforcement.mjs` on `ENFORCEMENT.md` and `CLAUDE.md`
- [ ] `.github/workflows/ci.yml` has an `enforcement` job running `pnpm run check:enforcement`
- [ ] The instruction file tells the agent to promote corrections instead of adding prose (the "When corrected" section of this module's `CLAUDE.template.md`; procedure in [PROMOTE.md](PROMOTE.md))
- [ ] Every other active module's binding rules appear in the table with that module's script, hook or CI job as the enforcer

## Apply

1. Copy `CLAUDE.template.md` to `CLAUDE.md` at the project root. Fill in the project section; keep "Enforcement" and "When corrected" as written. If the project already has a `CLAUDE.md`, merge those two sections into it instead of replacing it
2. Copy `scripts/check-enforcement.mjs` to `scripts/`
3. Create `ENFORCEMENT.md` from the table in this repo's `template/ENFORCEMENT.md`: keep the rows for modules the project has applied, delete the rest, and add one row per binding rule the project's existing `CLAUDE.md`, README or contributing guide states. Find each rule's enforcer (a biome rule, a hook, a CI job, a test, a type); where none exists, mark the row `convention` / `review` with an expiry date and reason — that row is a defect to fix, not a resting place
4. Add to `package.json`:
   ```json
   "scripts": {
     "check:enforcement": "node scripts/check-enforcement.mjs"
   },
   "lint-staged": {
     "{ENFORCEMENT,CLAUDE}.md": "node scripts/check-enforcement.mjs"
   }
   ```
   (merge into the existing blocks — see the hooks module)
5. Add the `enforcement` job from `modules/ci/.github/workflows/ci.yml` to `.github/workflows/ci.yml`
6. Run `pnpm run check:enforcement`; fix every error, then re-run the Check section
7. Tell the team the correction rule: see [PROMOTE.md](PROMOTE.md)

## Conflicts

- If the project already has `CLAUDE.md` or `AGENTS.md`, keep its content and add the "Enforcement" and "When corrected" sections. If it keeps `AGENTS.md` only, the checker accepts that — `CLAUDE.md` can be a one-line `@AGENTS.md` import
- If existing rules cannot be matched to an enforcer, do not invent one to make the table pass — list them as dated `convention` / `review` exceptions and report them as the project's backlog of defects
- If a project forbids dated exceptions, drop the exception rows and fail on any rule without a mechanical enforcer; the checker needs no change
- Rules the project's other modules already enforce need no new tooling — the row just names the existing script, hook or job
