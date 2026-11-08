# Module: Data Seam

Application code never touches the database client. One folder (`src/lib/supabase` in the template) imports the client packages and exposes typed functions; everything else calls those functions. Agents copy the nearest example, and when the nearest example is a file that builds a client inline, every new file does the same. A rule that only one folder may import the client removes that example. The module says where the client may be imported, not what the database is: "Supabase for everything server-side" is unchanged.

`check:seam` fails on any import of a listed client package outside the seam folder. Existing violators sit on a shrinking allow-list.

Imports caught: `import`, `import type`, `export ... from`, dynamic `import()` and `require()`, for the package name or any subpath of it.

## Check

- [ ] `scripts/check-data-seam.ts` exists and is byte-identical to this module's copy
- [ ] `typescript` `^5` (below 7) is in devDependencies (the scanner uses `ts.preProcessFile`, which TypeScript 7 removed)
- [ ] `data-seam.config.json` exists at the project root with `dirs`, `exclude`, `seam`, `packages` and `baseline`, and `seam` names the one folder that holds the client
- [ ] `.data-seam-baseline.json` exists and is committed
- [ ] `package.json` has a `"check:seam"` script running `bun scripts/check-data-seam.ts`
- [ ] lint-staged runs `bun scripts/check-data-seam.ts` on staged `*.{ts,tsx,js,jsx,mjs,cjs}`
- [ ] `.github/workflows/data-seam.yml` exists and runs `pnpm run check:seam` (with `oven-sh/setup-bun`)
- [ ] `src/test/check-data-seam.test.ts` exists, is byte-identical to this module's copy, and passes
- [ ] No function outside the seam folder returns a database client
- [ ] The agent instruction file has the data-seam line from `modules/agent-guardrails/CLAUDE.template.md`
- [ ] `ENFORCEMENT.md` has the data-seam row
- [ ] `pnpm run check:seam` exits 0

## Apply

1. Run `pnpm add -D typescript@^5` if it is missing or at 7 or above.
2. Copy `scripts/check-data-seam.ts`, `data-seam.config.json` and `src/test/check-data-seam.test.ts` from this module. Set `seam` to the folder that will hold the client (create it if it does not exist) and `packages` to the client packages the project uses (an ORM instead of supabase-js: change the package names; the structure is the same). List generated files that legitimately import a client under `exclude`.
3. Add to `package.json`:
   ```json
   "scripts": {
     "check:seam": "bun scripts/check-data-seam.ts"
   },
   "lint-staged": {
     "*.{ts,tsx,js,jsx,mjs,cjs}": "bun scripts/check-data-seam.ts"
   }
   ```
   (merge into the existing blocks - see the hooks module)
4. Copy `.github/workflows/data-seam.yml`.
5. Run `pnpm run check:seam -- --baseline`. In a fresh project the allow-list stays empty. In an existing project it records every current violator with its import count; commit it.
6. Add the data-seam row to `ENFORCEMENT.md` and the data-seam line to the agent instruction file.
7. Run `pnpm run check:seam`; it must exit 0. Then run the migration sweep below.

Migration sweep: for each file on the allow-list, move the client use into a typed function in the seam folder and call that function instead, leaf features first and one feature per PR. Then run `pnpm run check:seam -- --baseline` to lower the count. The baseline refuses to grow or add files. The check also fails when a count has dropped below its allow-list entry, so the ratchet is committed with the migration.

Some files cannot move for a framework reason (in the template, `src/proxy.ts` must build a session client at the request edge). Leave them on the allow-list; an entry is a recorded exception, not a failure.

## Conflicts

- A project with ESLint `no-restricted-imports` or boundaries rules: Canon bans ESLint; remove them with the linter migration
- A project that already restricts the client with a Biome `noRestrictedImports` override: keep one enforcer; prefer this check because it has the allow-list ratchet, which Biome overrides cannot count
- Projects that use an ORM instead of supabase-js: change `packages`; the rest is the same
- Generated types (`database.ts`): they import no client, so they need no entry; if a generator emits client imports, list the file under `exclude`
- Test files that import the client directly: move the setup into the seam folder, or list the test under `exclude`
- Files copied verbatim from canon modules that import the client (`require-admin.ts` in content-acceptance): record them on the allow-list until the module routes through the seam
