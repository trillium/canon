create table if not exists public.feedtack_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  comment text not null,
  sentiment text check (sentiment in ('positive', 'negative', 'neutral')),
  selector text,
  rect jsonb,
  viewport jsonb,
  url text not null,
  user_agent text,
  status text default 'open' check (status in ('open', 'triaged', 'resolved')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.feedtack_submissions enable row level security;

create policy "Users can insert own submissions"
  on public.feedtack_submissions for insert
  with check (auth.uid() = user_id);

create policy "Users can view own submissions"
  on public.feedtack_submissions for select
  using (auth.uid() = user_id);

create index if not exists idx_feedtack_url on public.feedtack_submissions(url);
create index if not exists idx_feedtack_status on public.feedtack_submissions(status);
