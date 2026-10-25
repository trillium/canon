# Promoting a correction

When an agent is corrected — by a human, a failing check, a review comment — the correction is a signal that a class of mistake is possible. Closing that class beats telling the agent not to repeat it. Do not answer a correction by adding a sentence to `CLAUDE.md`.

## The ladder

Strongest first. Fix a class at the highest rung that works.

| Rung | Enforcer | Example |
|------|----------|---------|
| 1 | **Structure** — the mistake cannot be written | a type that has no invalid state; a component that is the only way to render X; `requireAdmin` as the only door to accept |
| 2 | **Static check** — a tool refuses it | a Biome rule, a lint script, a hook, a test, a CI job |
| 3 | Rule or skill — the agent is asked to remember | a line in `CLAUDE.md` — not quite enforceable |
| 4 | Human review or style guide | "a big glaring hole" |

Rungs 3 and 4 are not enforcers. A rule that rests on them is a defect (`convention`, `review`, `audit` in `ENFORCEMENT.md`).

## Procedure

1. **Name the class, not the instance.** "The agent used `middleware.ts`" is an instance; "any code can introduce a deprecated Next.js 16 file convention" is the class
2. **Climb from the top.** Can the code be shaped so the mistake does not compile or cannot be expressed (rung 1)? If not, can a lint, script, hook, test or CI job reject it (rung 2)? Stop at the first yes
3. **Build the enforcer and prove it blocks.** A test that feeds it the mistake and asserts rejection — the pattern in `src/test/design-system-enforcement.test.ts`. An enforcer that was never seen to fail is a draft
4. **Make it run where agents and CI both hit it.** A hook or lint-staged entry for fast feedback, a CI job for the guarantee (so `--no-verify` is caught)
5. **Register it.** Add a row to `ENFORCEMENT.md` naming the rule, its kind and the enforcer file. `pnpm run check:enforcement` verifies the file exists
6. **Write no duplicate prose.** If the fix is structural, use only the structural fix — the instruction was the symptom. The row in `ENFORCEMENT.md` is the whole record
7. **Only if no rung 1 or 2 fix exists:** record the rule as a `convention` or `review` row with an expiry date and the reason no mechanical check is possible. It expires; renew it with a reason or build the enforcer
8. **Upstream it.** If the enforcer would help other projects, file an issue on canon (see README, "Contributing Back") so it can become a Check item in the module's `audit.md`, and a canonical script in the module

## Canon's own corrections

Canon follows the same procedure: a correction to a module or the spec becomes a new line in that module's `audit.md` **Check** section *and* — where a script can decide it — a CI step in `.github/workflows/conformance.yml`. The check that every module's `audit.md` has Check, Apply and Conflicts sections started as a sentence in `CLAUDE.md` and is now a CI step.
