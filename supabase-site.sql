-- =====================================================================
-- RASEL ON THE RUN — PUBLISH TO THE WEB (run once in Supabase > SQL Editor)
-- Creates a public "site" storage bucket. Everyone can VIEW the published
-- website files; ONLY the owner email below can upload, change or delete.
-- If you change your owner email, change it in every place below (search for it) and
-- in site-config.js (cloud.ownerEmail).
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('site', 'site', true)
on conflict (id) do update set public = true;

drop policy if exists "rnr site owner read"   on storage.objects;
drop policy if exists "rnr site owner insert" on storage.objects;
drop policy if exists "rnr site owner update" on storage.objects;
drop policy if exists "rnr site owner delete" on storage.objects;

create policy "rnr site owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'site' and lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'));

create policy "rnr site owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site' and lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'));

create policy "rnr site owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'site' and lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'))
  with check (bucket_id = 'site' and lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'));

create policy "rnr site owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site' and lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'));

-- =====================================================================
-- GUESTBOOK (About Me page)
-- Visitors can leave a short message. Messages stay hidden until the
-- owner approves them in Admin mode. Visitors can only ADD new messages
-- and READ approved ones; only the owner can see waiting messages,
-- approve or delete.
-- =====================================================================
create table if not exists public.guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  place text check (place is null or char_length(place) <= 60),
  message text not null check (char_length(btrim(message)) between 2 and 500),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.guestbook enable row level security;

drop policy if exists "guestbook visitors add"      on public.guestbook;
drop policy if exists "guestbook visitors read"     on public.guestbook;
drop policy if exists "guestbook owner read"        on public.guestbook;
drop policy if exists "guestbook owner update"      on public.guestbook;
drop policy if exists "guestbook owner delete"      on public.guestbook;

create policy "guestbook visitors add" on public.guestbook
  for insert to anon, authenticated
  with check (approved = false);

create policy "guestbook visitors read" on public.guestbook
  for select to anon, authenticated
  using (approved = true);

create policy "guestbook owner read" on public.guestbook
  for select to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'));

create policy "guestbook owner update" on public.guestbook
  for update to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'))
  with check (lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'));

create policy "guestbook owner delete" on public.guestbook
  for delete to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('raselahmmed1520@gmail.com'));

grant insert, select on public.guestbook to anon;
grant select, insert, update, delete on public.guestbook to authenticated;
