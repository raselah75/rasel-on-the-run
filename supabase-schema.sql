-- Optional private cloud backup for Rasel On the Run.
-- Run this in Supabase SQL Editor in your own project.
-- Enable Email authentication in Supabase Auth before using cloud backup.

create table if not exists public.travel_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.travel_backups enable row level security;

drop policy if exists "Users can read their own travel backup" on public.travel_backups;
create policy "Users can read their own travel backup"
  on public.travel_backups for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own travel backup" on public.travel_backups;
create policy "Users can insert their own travel backup"
  on public.travel_backups for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own travel backup" on public.travel_backups;
create policy "Users can update their own travel backup"
  on public.travel_backups for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
