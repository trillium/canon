# Module: Auth

## Check

- [ ] `@supabase/supabase-js` in dependencies
- [ ] `@supabase/ssr` in dependencies
- [ ] Server-side Supabase client in `src/lib/supabase/server.ts`
- [ ] Browser-side Supabase client in `src/lib/supabase/client.ts`
- [ ] Proxy handles session refresh (`src/proxy.ts`)
- [ ] Auth callback route at `src/app/auth/callback/route.ts`
- [ ] Login page exists
- [ ] Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Database types at `src/types/database.ts` (generated via `pnpm gen:types`)
- [ ] `gen:types` script in `package.json`

## Apply

1. Run `pnpm add @supabase/supabase-js @supabase/ssr`
2. Create `src/lib/supabase/server.ts` — SSR client factory using cookies
3. Create `src/lib/supabase/client.ts` — browser client factory
4. Create `src/proxy.ts` — session refresh on every request (Next.js 16 proxy pattern)
5. Create `src/app/auth/callback/route.ts` — OAuth/magic link callback
6. Create login page at `src/app/login/page.tsx`
7. Add env vars to `.env.local.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
8. Add `gen:types` script to `package.json`:
   ```json
   "gen:types": "supabase gen types typescript --linked > src/types/database.ts"
   ```
9. Create placeholder `src/types/database.ts` — regenerate after linking Supabase project and running migrations

## Conflicts

- If project uses a different auth provider (NextAuth, Clerk, Auth0), flag for manual review — do not replace without explicit approval
- If project already has Supabase but uses the old `createServerComponentClient` pattern, migrate to `@supabase/ssr` pattern
