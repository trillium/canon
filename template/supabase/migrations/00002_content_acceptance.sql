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

-- Single-statement updates so concurrent accepts never overwrite each other.
create or replace function accept_content_field(p_page text, p_field text, p_hash text, p_email text)
returns jsonb
language sql
as $$
  update page_content
  set accepted_fields = jsonb_set(
    accepted_fields,
    array[p_field],
    jsonb_build_object(
      'hash', p_hash,
      'by', case
        when accepted_fields -> p_field ->> 'hash' = p_hash then
          (select to_jsonb(array_agg(distinct e))
           from jsonb_array_elements_text(accepted_fields -> p_field -> 'by' || to_jsonb(p_email)) as e)
        else jsonb_build_array(p_email)
      end,
      'at', to_jsonb(now())
    )
  )
  where page = p_page
  returning accepted_fields;
$$;

create or replace function unaccept_content_field(p_page text, p_field text)
returns jsonb
language sql
as $$
  update page_content
  set accepted_fields = accepted_fields - p_field
  where page = p_page
  returning accepted_fields;
$$;
