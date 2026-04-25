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
