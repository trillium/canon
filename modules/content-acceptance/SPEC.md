# Content Acceptance Spec

A field of copy is *accepted* when a human has confirmed the exact current text. Anything an agent drafts or a collaborator edits is unaccepted until a human accepts it.

## Content model

- Content is JSON per page. A field is addressed `page.section.field`; array items `page.section.field[index]`.
- Every rendered copy string carries `data-content="page.section.field"`, or lives under `data-content-skip="reason"`. Valid skip reasons: content derived from other sources, structural UI text ("Learn more →"), external feeds, infrastructure pages.
- Structural keys (`href`, `src`, `alt`, `img`, `type`, `rows`, `metadata`, …) are not copywriting and are excluded from acceptance. Extend the set per project, in one place.

## No literal text in components

Component files (`.tsx`/`.jsx`) contain no user-visible literal text. Every string is a variable imported from a JSON content file (`src/content/<page>.json`, re-exported by `src/content/index.ts`).

```tsx
import { home } from "@/content";
<h1 data-content="home.heading">{home.heading}</h1>   // good
<h1>Welcome</h1>                                      // violation
```

- **Flagged:** JSX text containing a letter; string/template literals rendered as JSX children (`{"Hi"}`, `{ok ? "Yes" : "No"}`); string literals in copy props (`placeholder`, `title`, `alt`, `label`, `aria-label`, `aria-description`, `aria-placeholder`, `aria-roledescription`).
- **Allowed:** variables, numbers, punctuation and symbols (`→ • ×`), entities (`&nbsp;`), non-copy props (`className`, `href`, `type`, …), and anything in the content directory, test, spec or stories files.
- **Enforced twice:** Biome `style.noJsxLiterals` (error; off in test files) via `pnpm lint`, and `scripts/lint-literals.mjs` — run on staged files by lint-staged, and over the whole source tree by `pnpm lint:literals` / CI. Exit 1 on any violation.
- **Escape hatches** are rare, always carry a reason, and are listed in the lint output so reviewers see every one:
  - one line: `{/* content-ok: reason */}` on the same line or the line above (`// content-ok: reason` in plain code)
  - a subtree: `<div data-content-skip="reason">…</div>`
  - a bare `content-ok` or an empty `data-content-skip` is itself a violation. Valid reasons match the `data-content-skip` list above (derived content, external feeds, structural UI text, brand names).
- Because copy now lives in JSON, the acceptance rules apply to every visible string: editing a JSON value changes its hash, so the field is unaccepted until a human accepts it again.

## Colocated records

Keep each page's or component's content record next to the component that renders it, not in one far-away file:

```
slides/src/slides/<n>-<slug>/slide.tsx
slides/src/slides/<n>-<slug>/slide.json   # the record
```

- The aggregate (`content.json`, or `content/<page>.json`) is **generated** from the colocated records — never hand-edited. Sidecar acceptance and the lint/report scripts read the aggregate.
- A colocated record may carry, besides the copy fields: `id`, `title`, an `importance` of `core | optional | cut-candidate` with a one-line `importanceReason`, an acceptance status derived per the rules below, and measurable `signals` (e.g. word count, step count, time in the run-of-show, last edited) so importance can be judged from data. Non-copy metadata (`importance*`, `signals`, `id`) belongs under structural keys so it is never itself subject to acceptance.
- The rules below apply unchanged: acceptance is keyed by `page.section.field`, where `page` is the record's id.

## Acceptance record

```json
"section.field": { "hash": "a1b2c3d4e5f6", "by": ["human@example.com"], "at": "2026-01-01T00:00:00.000Z" }
```

- `hash` = `fieldHash(value)` = first 12 hex chars of SHA-256 of the field's string value.
- `by` = every human who accepted this exact hash. A second human accepting the same text is appended; accepting different text replaces the record.
- `at` = ISO timestamp of the latest accept.
- Database variant: stored in `page_content.accepted_fields`, keys without the page prefix. Sidecar variant: `content/.accepted.json`, keys with the page prefix.

## Rules

1. **Unaccepted = missing or hash mismatch.** No record, or the record's hash differs from the hash of the current value.
2. **Edits invalidate.** Changing a value makes it unaccepted at once (hash mismatch); the edit path should also delete the stale record.
3. **Accept / unaccept.** Accept records the current value; unaccept deletes the record. Both are idempotent.
4. **Agents may never accept.** Acceptance requires an authenticated human session (database variant) or an interactive terminal outside CI/agent environments (sidecar variant). There is no token, header or flag that bypasses this. Agents may read status, draft, and edit — never accept.
5. **Deploy gate.** Before publishing, compute all unaccepted fields.
   - Default (**warn**): publish proceeds; unaccepted fields are listed in the response/log.
   - **Hard gate** (`CONTENT_ACCEPTANCE_GATE=hard`, or `gate --hard` in the sidecar): publish is refused (HTTP 409 / exit 1) with the unaccepted list.

## Status shape

```json
{ "pages": [{ "page": "home", "unaccepted": 2, "unaccepted_fields": ["hero.heading", "hero.items[1]"], "accepted_fields": {} }], "totalUnaccepted": 2 }
```

## UI contract (database variant)

Per-page unaccepted counts with Accept All, per-field Accept/Unaccept, and a distinct visual state for unaccepted fields (e.g. `[data-unaccepted]`). Accepting a field may auto-resolve open review comments on it.
