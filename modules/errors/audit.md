# Module: Errors

## Check

- [ ] `@sentry/nextjs` in dependencies
- [ ] `sentry.client.config.ts` exists
- [ ] `sentry.server.config.ts` exists
- [ ] `sentry.edge.config.ts` exists
- [ ] `next.config` wraps with `withSentryConfig`
- [ ] Global error boundary at `src/app/global-error.tsx`
- [ ] Environment variables: `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`

## Apply

1. Run `pnpm add @sentry/nextjs`
2. Run `pnpm dlx @sentry/wizard@latest -i nextjs` — or manually create:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
3. Update `next.config.ts` to wrap with `withSentryConfig`
4. Create `src/app/global-error.tsx` error boundary
5. Add to `.env.local.example`:
   ```
   SENTRY_DSN=
   SENTRY_ORG=
   SENTRY_PROJECT=
   SENTRY_AUTH_TOKEN=
   ```

## Conflicts

- If project uses a different error tracking service (Bugsnag, Rollbar, LogRocket), flag for review
- Sentry's Next.js plugin modifies webpack config — check for conflicts with other plugins
