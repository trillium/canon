# Retrofit Playbook

Instructions for an AI agent to audit and retrofit a target project against canon.

## Workflow

### Phase 1: Discover

1. Read `CANON.md` to understand the full spec
2. Read the target project's `package.json`, config files, and directory structure
3. Identify which canon modules are relevant

### Phase 2: Audit

For each module in `modules/`:
1. Read the module's `audit.md`
2. Execute the **Check** section against the target project
3. Record conformance status: **conformant**, **partial**, **missing**, or **not applicable**

### Phase 3: Plan

Present a module-level plan to the user:

```
## Retrofit Plan for <project-name>

### Conformant
- ✓ linting — biome.json present, rules match
- ✓ hooks — husky + lint-staged configured

### Needs Work
- ~ testing — vitest present, playwright missing
- ~ ci — has CI but missing a11y job

### Missing
- ✗ feedtack — no feedtack integration
- ✗ analytics — no posthog

### Not Applicable
- ○ email — no email functionality in this project

### Recommended Action
Apply: testing, ci, feedtack, analytics
Skip: email (not applicable)
```

For each module marked "Needs Work" or "Missing", show the file-level changes:

```
### Module: feedtack
- ADD src/providers/FeedtackProvider.tsx
- ADD src/app/api/feedtack/route.ts
- ADD supabase/migrations/NNNN_feedtack_submissions.sql
- MODIFY src/app/layout.tsx — wrap with FeedtackProvider
- MODIFY package.json — add feedtack dependency
```

### Phase 4: Gate

**Wait for user approval.** The user approves or skips each module individually. Do not apply anything without explicit approval.

### Phase 5: Apply

For each approved module:
1. Follow the **Apply** section in the module's `audit.md`
2. Handle any **Conflicts** noted in `audit.md` — present these to the user for decision
3. After applying, re-run the **Check** section to verify conformance

### Phase 6: Verify

After all approved modules are applied:
1. Run `pnpm install` (or equivalent)
2. Run `pnpm run lint` — must pass
3. Run `pnpm run build` — must pass
4. Run `pnpm test` — if tests exist, must pass
5. Report results

## Module Order

Apply modules in this order to avoid dependency issues:

1. `linting` — foundational, other modules assume biome
2. `hooks` — depends on linting config
3. `styling` — many modules reference tailwind/shadcn
4. `auth` — feedtack and other modules may depend on auth
5. `testing` — can validate other modules
6. `ci` — validates everything
7. `feedtack` — depends on auth, styling
8. `email` — depends on auth
9. `analytics` — independent, safe to add anytime
10. `errors` — independent, safe to add anytime

## Notes

- Never remove existing functionality that isn't part of canon's scope
- If the target uses ESLint/Prettier, remove them only when applying the linting module
- Preserve existing tests — add canon's test config alongside them
- If a module's apply step would break existing code, flag it as a conflict
