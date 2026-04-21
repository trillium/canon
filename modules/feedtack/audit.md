# Module: Feedtack

## Check

- [ ] `feedtack` in dependencies
- [ ] `FeedtackProvider` component exists in `src/providers/` or `src/components/`
- [ ] Provider wraps the app in root layout
- [ ] Auth-gated: only visible to admins or opted-in users
- [ ] API route exists at `src/app/api/feedtack/route.ts`
- [ ] API route validates with Zod
- [ ] API route has rate limiting
- [ ] Supabase migration for `feedtack_submissions` table exists
- [ ] RLS enabled on `feedtack_submissions`

## Apply

1. Run `pnpm add feedtack`
2. Copy `FeedtackProvider.tsx` to `src/providers/`
3. Copy `route.ts` to `src/app/api/feedtack/`
4. Copy `migration.sql` to `supabase/migrations/` with appropriate timestamp prefix
5. Wrap root layout with `<FeedtackProvider>`
6. Add Zod validation schema for submissions if not present (`pnpm add zod` if needed)
7. Run `pnpm supabase db push` or `pnpm supabase migration up` to apply migration

## Conflicts

- If project doesn't use Supabase, the migration and RLS won't apply — flag for manual backend adaptation
- If project has an existing feedback system, flag for review rather than replacing
- If project has no auth, feedtack will be visible to all users — note this in the plan
