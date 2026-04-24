# Canon — Repo Conventions

This is the canon repo itself. When working on this repo:

## Structure

- `CANON.md` is the source of truth for the spec
- `RETROFIT.md` is the agent playbook for retrofitting target projects
- `modules/` each have an `audit.md` (check/apply/conflicts) plus canonical config files
- `template/` is a skeleton Next.js app with all modules applied

## Editing Modules

- Every module must have an `audit.md` with three sections: Check, Apply, Conflicts
- Config files in a module are the canonical versions — they get copied to target projects
- When updating a module's config, also update the template to match

## Template Conformance

The template must pass a retrofit audit against all modules. CI enforces this on every PR.

## Commits

- `feat(module): description` for new modules
- `fix(module): description` for module fixes
- `docs: description` for spec/readme changes
- `chore: description` for CI, repo maintenance


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
