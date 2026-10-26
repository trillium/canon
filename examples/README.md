# Examples

## starter/

A complete, runnable Next.js app that has Canon's standards applied and passes its own checks: type-check,
lint, unit tests, build, design-system and enforcement checks, a file-length limit, content checks,
accessibility and end-to-end tests, and Playwright screenshot baselines.

`template/` is the skeleton that retrofits and conformance checks are measured against. `examples/starter/`
is what a project looks like once it has grown past that skeleton: the same modules, plus the file-length
check, API response messages kept in JSON content files, TypeScript check scripts under `scripts/` (with
shared helpers in `scripts/lib/`), and a visual-regression CI job that runs in a pinned Playwright container.

Copy the folder to start a project. It is self-contained: it has its own `package.json`, lockfile, git hooks
and CI workflows, and nothing in it refers to files outside the folder. See `starter/README.md` to run it.

The example is not part of the template conformance check; `template/` and `modules/` are unchanged by it.
