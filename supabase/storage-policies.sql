-- Run in Supabase Dashboard → SQL Editor
-- Fixes: StorageApiError: new row violates row-level security policy

-- 1. Create public bucket for listing photos (skip if it already exists)
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

-- 2. Storage policies (drop first if re-running)
drop policy if exists "Public read listing images" on storage.objects;
drop policy if exists "Anon upload listing images" on storage.objects;
drop policy if exists "Anon update listing images" on storage.objects;
drop policy if exists "Anon delete listing images" on storage.objects;

create policy "Public read listing images"
  on storage.objects for select
  to public
  using (bucket_id = 'listing-images');

create policy "Anon upload listing images"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'listing-images');

create policy "Authenticated upload listing images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-images');

create policy "Anon update listing images"
  on storage.objects for update
  to anon
  using (bucket_id = 'listing-images');

create policy "Authenticated update listing images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'listing-images');

create policy "Anon delete listing images"
  on storage.objects for delete
  to anon
  using (bucket_id = 'listing-images');

create policy "Authenticated delete listing images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-images');
