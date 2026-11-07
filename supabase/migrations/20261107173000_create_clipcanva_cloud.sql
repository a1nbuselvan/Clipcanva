create table if not exists public.clipcanva_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{"items":[],"links":[],"colls":[],"v":{"x":0,"y":0,"z":1}}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.clipcanva_workspaces enable row level security;

drop policy if exists "Users can read their own Clipcanva workspace"
  on public.clipcanva_workspaces;
create policy "Users can read their own Clipcanva workspace"
  on public.clipcanva_workspaces
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own Clipcanva workspace"
  on public.clipcanva_workspaces;
create policy "Users can create their own Clipcanva workspace"
  on public.clipcanva_workspaces
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Clipcanva workspace"
  on public.clipcanva_workspaces;
create policy "Users can update their own Clipcanva workspace"
  on public.clipcanva_workspaces
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Clipcanva workspace"
  on public.clipcanva_workspaces;
create policy "Users can delete their own Clipcanva workspace"
  on public.clipcanva_workspaces
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'clipcanva-assets',
  'clipcanva-assets',
  false,
  8388608,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own Clipcanva assets"
  on storage.objects;
create policy "Users can read their own Clipcanva assets"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can upload their own Clipcanva assets"
  on storage.objects;
create policy "Users can upload their own Clipcanva assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update their own Clipcanva assets"
  on storage.objects;
create policy "Users can update their own Clipcanva assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their own Clipcanva assets"
  on storage.objects;
create policy "Users can delete their own Clipcanva assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
