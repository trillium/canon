# Canon Spec

The authoritative definition of Trillium's project standard. Every module in `modules/` implements a piece of this spec.

## Core Principles

- **Bun runtime, pnpm packages** — fast execution, reliable dependency management
- **Biome over ESLint/Prettier** — single tool for linting and formatting
- **Supabase for everything server-side** — auth, database, realtime, storage
- **Feedtack for stakeholder feedback** — first-class, not an afterthought
- **Vercel for deploy** — zero-config, preview deploys, edge functions
- **Agent-friendly** — CLAUDE.md, clear conventions, minimal implicit knowledge

## Stack Specification

### Framework
- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)

### Runtime & Package Management
- Bun as runtime
- pnpm as package manager
- `packageManager` field set in `package.json`

### Linting & Formatting
- Biome as sole linter and formatter
- Recommended rules + a11y rules (warn level for incremental adoption)
- Security rules (`noDangerouslySetInnerHtml`) as errors
- Import organization via Biome assist
- Double quotes, 2-space indent
- CSS support with Tailwind directives enabled
- No ESLint. No Prettier.

### Git Hooks
- Husky for git hook management
- lint-staged for pre-commit: `biome check --write` on staged files
- Large file guard (250 lines) as warning

### Testing
- Vitest for unit/integration tests
- Testing Library for component tests
- Playwright for end-to-end tests
- Axe-core integration for a11y testing

### CI/CD
- GitHub Actions
- Jobs: type-check, biome lint, unit tests (vitest), build, a11y (axe-core + Playwright)
- All jobs run in parallel on PR

### Styling
- Tailwind CSS 4
- shadcn/ui components (Radix UI primitives)
- CVA for variant management
- lucide-react for icons
- clsx + tailwind-merge for class composition

### Design System
- Raw HTML elements (`<button>`, `<input>`, `<p>`, `<h1>`–`<h6>`, `<a>`, `<div>`, …) are banned outside `components/ui/`; each has a design-system component that replaces it
- `components/ui/manifest.ts` is the single source of truth: each rule names the banned markup, its replacement and the import path. The generic manifest is identical in every project; per-project choices (which presets are enforced, overrides, custom rules) live in `manifest.config.ts`
- Rules are enabled incrementally — a rule is turned on when its component exists, so adoption never breaks a build
- Four enforcement layers, all driven by the manifest:
  - Claude Code `PreToolUse` hook rejects `Write`/`Edit` that introduce raw tags (existing lines are not flagged)
  - lint-staged checks added lines in staged files
  - Husky pre-push sweeps the whole repo
  - CI `design-system` job runs the same sweep
- Coverage: every primitive in `components/ui/` must have a manifest entry, and every manifest component must appear on the catalogue page
- A `/design-system` catalogue page is required — enforcement without a place to discover the replacements is a closed door. It shows token swatches, the type scale, a live example of every component, the rules table and the opt-out directives
- Escape hatches: `// ds-ignore` (nearby lines), `/* ds-ignore-file */` (whole file); a rule can opt out of both with `noEscapeHatch`
- Scripts run on Bun (`scripts/check-design-system.ts`, `check-ds-coverage.ts`, `check-ds-page.ts`)

### Auth
- Supabase Auth with SSR pattern
- Magic link, OAuth (Google), password flows
- Proxy-based session refresh (`src/proxy.ts`)

### Database
- Supabase PostgreSQL
- Row Level Security on all tables
- Migrations in `supabase/migrations/`
- Generated TypeScript types via `pnpm gen:types` (`src/types/database.ts`)
- Zod for runtime validation at API boundaries

### Feedback
- Feedtack widget for spatial stakeholder feedback
- Auth-gated visibility (admin + opted-in users)
- Webhook adapter posting to `/api/feedtack`
- Supabase `feedtack_submissions` table with RLS
- Zod validation + rate limiting on API route

### Email
- Resend as provider
- React Email for templates
- Transactional templates: welcome, password reset, feedback notification

### Analytics
- PostHog for product analytics
- Client-side initialization
- Feature flags support

### Error Tracking
- Sentry for error monitoring
- Source maps uploaded on build
- Environment-aware (dev/staging/prod)

### Content Acceptance
- Copy is JSON per page, colocated with its component; every string carries `data-content="page.section.field"` or `data-content-skip="reason"`
- Human sign-off per field: `{hash, by, at}` records, `fieldHash` = sha256 truncated to 12 hex; unaccepted = missing or hash mismatch; edits invalidate
- Deploy gate warns by default, hard-blocks with `CONTENT_ACCEPTANCE_GATE=hard`
- Agents may never accept
- Database variant (Supabase) or sidecar-file variant (static sites); see `modules/content-acceptance/SPEC.md`

### State Management
- Zustand for client state
- No Redux. No Context for complex state.

### Utilities
- Zod for validation
- date-fns for date manipulation
- clsx + tailwind-merge for class names

### Project Structure
```
src/
  app/
    api/          # API routes
    admin/        # admin-only pages
    (public)/     # public pages
    layout.tsx
    page.tsx
  components/     # shared components
  providers/      # context providers (auth, feedtack, analytics, etc.)
  lib/            # utilities, supabase client, constants
  types/          # shared TypeScript types
public/           # static assets
supabase/
  migrations/     # database migrations
```

### Deploy
- Vercel
- Preview deploys on PR
- Production deploy on merge to main
- Environment variables managed via Vercel dashboard
