-- Content acceptance: one row per page, acceptance records per field.
-- accepted_fields shape: { "section.field": { "hash": "<sha256-12>", "by": ["email"], "at": "<iso>" } }
-- Keys omit the page prefix (the page is the row key).
create table if not exists page_content (
  page text primary key,
  content jsonb not null default '{}'::jsonb,
  accepted_fields jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- If page_content already exists, this adds the column.
alter table page_content
  add column if not exists accepted_fields jsonb not null default '{}'::jsonb;

-- Server-only table: routes use the service role after an admin session check.
alter table page_content enable row level security;

-- Editing a field must invalidate its acceptance. A stale record already reads
-- as unaccepted (hash mismatch); the edit route should also delete the record
-- so `by`/`at` never describe text that no longer exists.
