-- Run after storage-policies.sql if listing INSERT also fails with RLS errors.
-- App uses anon key + sessionStorage (no Supabase Auth session).

alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.chopes enable row level security;
alter table public.users enable row level security;

drop policy if exists "Public read users" on public.users;
drop policy if exists "Anon insert users" on public.users;
drop policy if exists "Public read listings" on public.listings;
drop policy if exists "Public read listing_media" on public.listing_media;
drop policy if exists "Public read chopes" on public.chopes;
drop policy if exists "Anon insert listings" on public.listings;
drop policy if exists "Anon insert listing_media" on public.listing_media;
drop policy if exists "Anon insert chopes" on public.chopes;
drop policy if exists "Anon update listings" on public.listings;
drop policy if exists "Anon delete listings" on public.listings;
drop policy if exists "Anon delete listing_media" on public.listing_media;
drop policy if exists "Anon delete chopes" on public.chopes;

create policy "Public read users" on public.users for select to public using (true);
create policy "Anon insert users" on public.users for insert to anon with check (true);
create policy "Public read listings" on public.listings for select to public using (true);
create policy "Public read listing_media" on public.listing_media for select to public using (true);
create policy "Public read chopes" on public.chopes for select to public using (true);

create policy "Anon insert listings" on public.listings for insert to anon with check (true);
create policy "Anon insert listing_media" on public.listing_media for insert to anon with check (true);
create policy "Anon insert chopes" on public.chopes for insert to anon with check (true);

create policy "Anon update listings" on public.listings for update to anon using (true);
create policy "Anon delete listings" on public.listings for delete to anon using (true);
create policy "Anon delete listing_media" on public.listing_media for delete to anon using (true);
create policy "Anon delete chopes" on public.chopes for delete to anon using (true);
