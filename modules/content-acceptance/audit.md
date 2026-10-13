# Module: Content Acceptance

Human sign-off on copy. Every editable text field carries an acceptance record; edits invalidate it; deploys warn (or block) while anything is unaccepted. Full rules in [SPEC.md](SPEC.md).

Two variants — pick one per project:

- **Database variant** (Supabase `page_content` + admin edit UI): `lib/`, `routes/`, `supabase/`
- **Sidecar variant** (static site, content in git): `sidecar/content-acceptance.mjs`

Both variants share the `scripts/` lint and report tools.

## Check

- [ ] Every visible copy string is backed by `data-content="page.section.field"` (arrays: `field[i]`) or sits inside `data-content-skip="reason"`
- [ ] Each page/component's content record is colocated with its component; the aggregate JSON is generated from them (see SPEC, "Colocated records")
- [ ] `scripts/lint-content.mjs` and `scripts/content-report.mjs` exist and are byte-identical to this module's
- [ ] `package.json` has `"lint:content"` and `"content:report"` scripts
- [ ] Database variant: `src/lib/content-acceptance.ts` exports `fieldHash` (sha256, 12 hex chars), `STRUCTURAL_KEYS`, `collectFields`, `unacceptedFields`
- [ ] Database variant: `page_content.accepted_fields` jsonb column exists (`{ "section.field": { hash, by[], at } }`)
- [ ] Database variant: `GET /api/content/status`, `POST`/`DELETE /api/content/accept` exist and are gated by `requireAdmin` (human session only — no API-key, service-token or header bypass)
- [ ] Database variant: the content edit route deletes a field's acceptance record when its value changes
- [ ] Database variant: the deploy route reports unaccepted fields (warn by default, refuses when `CONTENT_ACCEPTANCE_GATE=hard`)
- [ ] Sidecar variant: `scripts/content-acceptance.mjs` exists and byte-identical; `content/.accepted.json` is committed
- [ ] Sidecar variant: CI or the deploy step runs `node scripts/content-acceptance.mjs gate`
- [ ] Nothing in the repo (scripts, agent configs, CI) can call accept on a human's behalf

## Apply

1. Mark up copy: add `data-content="page.section.field"` to every text element, `data-content-skip="reason"` to intentionally non-editable regions (derived content, structural UI text, external feeds)
2. Colocate one JSON record per component/page beside its source file, with a generator that builds the aggregate; put `importance`, `importanceReason` and `signals` keys in `STRUCTURAL_KEYS`
3. Copy `scripts/lint-content.mjs` and `scripts/content-report.mjs` to `scripts/`; add to `package.json`:
   ```json
   "lint:content": "node scripts/lint-content.mjs",
   "content:report": "node scripts/content-report.mjs"
   ```
4. Optional: add `content-acceptance.config.json` at the project root (`appDir`, `contentDir`, `skipRoutes`, `routes` overrides) — see the header of `lint-content.mjs`
5. **Database variant:**
   1. Copy `lib/content-acceptance.ts` and `lib/require-admin.ts` to `src/lib/`; extend `STRUCTURAL_KEYS` for the project
   2. Copy `routes/accept/route.ts` → `src/app/api/content/accept/route.ts` and `routes/status/route.ts` → `src/app/api/content/status/route.ts`
   3. Add the migration in `supabase/migration.sql` via `scripts/next-migration.sh`
   4. Set `ADMIN_EMAILS` (comma-separated) and `SUPABASE_SERVICE_ROLE_KEY`
   5. In the content edit route, delete `accepted_fields[fieldPath]` for every field whose value changed
   6. Wire the deploy route per `routes/deploy-gate/route.ts`; leave `CONTENT_ACCEPTANCE_GATE` unset (warn) or set `hard`
   7. Build the review UI against the status route: per-page unaccepted counts, per-field Accept/Unaccept, an "unaccepted" visual state
6. **Sidecar variant:** copy `sidecar/content-acceptance.mjs` to `scripts/`, run `node scripts/content-acceptance.mjs status`, have the human run `accept --all` after reviewing, commit `content/.accepted.json`, and add `gate` to the deploy workflow

## Conflicts

- Project already has a CMS or approval flow — keep it; only add the `data-content` convention and map its approvals onto `{hash, by, at}` records if feasible
- Content is not JSON-per-page (MDX, database rows) — adapt `collectFields` input; keep the hash and record shape unchanged
- Route-to-content-key differs from the default (`/` → `home`, `/a/b` → `a-b`) — add `routes` overrides in `content-acceptance.config.json`
- Project already defines other `STRUCTURAL_KEYS`-like exclusions — merge them into one list so status, deploy gate and report agree
- Hard gate on an existing site with unaccepted legacy copy — start in warn mode, accept the backlog as a human, then flip to `hard`
