-- =====================================================================
-- RASEL ON THE RUN — PUBLISH TO THE WEB (run once in Supabase > SQL Editor)
-- Creates a public "site" storage bucket. Everyone can VIEW the published
-- website files; ONLY the owner email below can upload, change or delete.
-- If you change your owner email, change it in all four places below and
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
