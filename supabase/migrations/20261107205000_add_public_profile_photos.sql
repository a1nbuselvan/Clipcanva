alter table public.clipcanva_profiles
  add column if not exists avatar_path text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'clipcanva-avatars',
  'clipcanva-avatars',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own profile photos"
  on storage.objects;
create policy "Users can upload their own profile photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'clipcanva-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their own profile photos"
  on storage.objects;
create policy "Users can delete their own profile photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'clipcanva-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
