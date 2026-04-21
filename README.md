# Canon

Trillium's canonical tech stack — the authoritative definition of how a project should look.

## What this is

A repo of modular config files and agent-readable instructions. It serves two purposes:

1. **Retrofit**: Point an agent at an existing project and this repo. The agent audits conformance, produces a module-level plan with file-level diffs, and applies approved changes.
2. **Greenfield**: Fork or degit `template/` for a new project that already conforms.

## Usage

In any Claude Code session on a target project:

> "Retrofit this project against github.com/trillium/canon"

The agent will:
1. Read this README → discover what canon is
2. Read `RETROFIT.md` → understand the workflow
3. Read `CANON.md` → understand the spec
4. Walk each module's `audit.md` → check conformance
5. Present a gated plan grouped by module
6. Apply approved modules

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Runtime | Bun |
| Package manager | pnpm |
| Database/Auth | Supabase (SSR) |
| Styling | Tailwind CSS 4 |
| Components | Radix UI + shadcn (CVA, lucide) |
| Linting | Biome |
| Testing | Vitest + Playwright |
| Git hooks | Husky + lint-staged |
| Analytics | PostHog |
| Error tracking | Sentry |
| Email | Resend + React Email |
| Deploy | Vercel |
| Feedback | Feedtack |
| Misc | Zustand, Zod, date-fns, clsx + tailwind-merge |

## Structure

```
canon/
  CANON.md               # the spec (human-readable)
  RETROFIT.md            # agent orchestration playbook
  modules/               # modular configs + audit instructions
    linting/
    hooks/
    testing/
    ci/
    feedtack/
    styling/
    auth/
    email/
    analytics/
    errors/
  template/              # skeleton Next.js app, all modules applied
```

## Contributing Back

Canon gets better when the projects it touches push improvements upstream. If you're retrofitting a project and discover that it already handles something better than canon does — a tighter biome rule, a smarter auth pattern, a testing approach that catches more bugs — **file an issue**.

The goal is maintainability across every project that uses canon. A fix in one place should flow to all the others. Specifically:

- **Found a better config?** Open an issue with the module name and what's better about it. Include the config or a link.
- **Hit a conflict that canon doesn't account for?** File it. The module's `audit.md` should grow to handle it.
- **A dependency moved on?** If a tool canon relies on has a better successor or a breaking change, that's an issue too.

Canon is not a frozen spec. It's a living standard that improves every time it touches a real project.

---

See [CANON.md](CANON.md) for the full spec. See [RETROFIT.md](RETROFIT.md) for the agent workflow.
