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

### Auth
- Supabase Auth with SSR pattern
- Magic link, OAuth (Google), password flows
- Middleware-based session refresh

### Database
- Supabase PostgreSQL
- Row Level Security on all tables
- Migrations in `supabase/migrations/`
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
