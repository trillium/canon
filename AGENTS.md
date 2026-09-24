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
- Wiring that must be identical in both places is enforced by `diff` steps
  in `.github/workflows/conformance.yml` — add a step when adding paired files

## Template Conformance

The template must pass a retrofit audit against all modules. CI enforces this on every PR.

## Commits

- `feat(module): description` for new modules
- `fix(module): description` for module fixes
- `docs: description` for spec/readme changes
- `chore: description` for CI, repo maintenance

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
