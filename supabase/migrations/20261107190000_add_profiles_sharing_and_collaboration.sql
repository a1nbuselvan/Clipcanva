create table if not exists public.clipcanva_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9][a-z0-9_-]{2,23}$'),
  display_name text not null
    check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clipcanva_profiles enable row level security;

drop policy if exists "Clipcanva profiles are discoverable"
  on public.clipcanva_profiles;
create policy "Clipcanva profiles are discoverable"
  on public.clipcanva_profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can create their own Clipcanva profile"
  on public.clipcanva_profiles;
create policy "Users can create their own Clipcanva profile"
  on public.clipcanva_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Clipcanva profile"
  on public.clipcanva_profiles;
create policy "Users can update their own Clipcanva profile"
  on public.clipcanva_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.create_clipcanva_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
  username text;
begin
  display_name := left(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      'Clipcanva member'
    ),
    60
  );
  username := 'member-' || left(replace(new.id::text, '-', ''), 16);

  insert into public.clipcanva_profiles (user_id, username, display_name)
  values (new.id, username, display_name)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_clipcanva_auth_user_created on auth.users;
create trigger on_clipcanva_auth_user_created
  after insert on auth.users
  for each row execute function public.create_clipcanva_profile();
revoke all on function public.create_clipcanva_profile() from public, anon, authenticated;

create table if not exists public.clipcanva_public_canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  data jsonb not null
    check (
      jsonb_typeof(data -> 'items') = 'array'
      and jsonb_typeof(data -> 'links') = 'array'
      and jsonb_typeof(data -> 'colls') = 'array'
    ),
  is_public boolean not null default true,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clipcanva_public_canvases_user_published_idx
  on public.clipcanva_public_canvases (user_id, published_at desc)
  where is_public;

alter table public.clipcanva_public_canvases enable row level security;

drop policy if exists "Published Clipcanva canvases are public"
  on public.clipcanva_public_canvases;
create policy "Published Clipcanva canvases are public"
  on public.clipcanva_public_canvases
  for select
  to anon, authenticated
  using (is_public or (select auth.uid()) = user_id);

drop policy if exists "Users can publish their own Clipcanva canvases"
  on public.clipcanva_public_canvases;
create policy "Users can publish their own Clipcanva canvases"
  on public.clipcanva_public_canvases
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Clipcanva canvases"
  on public.clipcanva_public_canvases;
create policy "Users can update their own Clipcanva canvases"
  on public.clipcanva_public_canvases
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own Clipcanva canvases"
  on public.clipcanva_public_canvases;
create policy "Users can remove their own Clipcanva canvases"
  on public.clipcanva_public_canvases
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.clipcanva_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  data jsonb not null default
    '{"items":[],"links":[],"colls":[],"v":{"x":0,"y":0,"z":1}}'::jsonb
    check (
      jsonb_typeof(data -> 'items') = 'array'
      and jsonb_typeof(data -> 'links') = 'array'
      and jsonb_typeof(data -> 'colls') = 'array'
    ),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.clipcanva_project_members (
  project_id uuid not null references public.clipcanva_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists clipcanva_project_members_user_idx
  on public.clipcanva_project_members (user_id, project_id);

create table if not exists public.clipcanva_project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.clipcanva_projects (id) on delete cascade,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, invitee_id)
);

create or replace function public.create_clipcanva_project(project_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_project uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to create a project';
  end if;
  if char_length(btrim(project_name)) not between 1 and 80 then
    raise exception 'Project names must be between 1 and 80 characters';
  end if;

  insert into public.clipcanva_projects (owner_id, name)
  values ((select auth.uid()), btrim(project_name))
  returning id into created_project;

  insert into public.clipcanva_project_members (project_id, user_id, role)
  values (created_project, (select auth.uid()), 'owner');
  return created_project;
end;
$$;

alter table public.clipcanva_projects enable row level security;
alter table public.clipcanva_project_members enable row level security;
alter table public.clipcanva_project_invites enable row level security;

create or replace function public.clipcanva_project_role(
  target_project uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clipcanva_project_members member
    where member.project_id = target_project
      and member.user_id = (select auth.uid())
      and member.role = any (allowed_roles)
  );
$$;

drop policy if exists "Project members can view their projects"
  on public.clipcanva_projects;
create policy "Project members can view their projects"
  on public.clipcanva_projects
  for select
  to authenticated
  using (public.clipcanva_project_role(id, array['owner', 'editor', 'viewer']));

drop policy if exists "Users can create their own projects"
  on public.clipcanva_projects;
create policy "Users can create their own projects"
  on public.clipcanva_projects
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Project editors can update project data"
  on public.clipcanva_projects;
create policy "Project editors can update project data"
  on public.clipcanva_projects
  for update
  to authenticated
  using (public.clipcanva_project_role(id, array['owner', 'editor']))
  with check (public.clipcanva_project_role(id, array['owner', 'editor']));

drop policy if exists "Project owners can delete projects"
  on public.clipcanva_projects;
create policy "Project owners can delete projects"
  on public.clipcanva_projects
  for delete
  to authenticated
  using (public.clipcanva_project_role(id, array['owner']));

drop policy if exists "Users can view project membership"
  on public.clipcanva_project_members;
create policy "Users can view project membership"
  on public.clipcanva_project_members
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.clipcanva_project_role(project_id, array['owner'])
  );

drop policy if exists "Project owners can add members"
  on public.clipcanva_project_members;
create policy "Project owners can add members"
  on public.clipcanva_project_members
  for insert
  to authenticated
  with check (
    (user_id = (select auth.uid()) and role = 'owner' and exists (
      select 1 from public.clipcanva_projects project
      where project.id = project_id and project.owner_id = (select auth.uid())
    ))
    or public.clipcanva_project_role(project_id, array['owner'])
  );

drop policy if exists "Project owners can remove members"
  on public.clipcanva_project_members;
create policy "Project owners can remove members"
  on public.clipcanva_project_members
  for delete
  to authenticated
  using (
    role <> 'owner'
    and public.clipcanva_project_role(project_id, array['owner'])
  );

drop policy if exists "Project members can view invitations"
  on public.clipcanva_project_invites;
create policy "Project members can view invitations"
  on public.clipcanva_project_invites
  for select
  to authenticated
  using (
    invitee_id = (select auth.uid())
    or public.clipcanva_project_role(project_id, array['owner', 'editor'])
  );

drop policy if exists "Project editors can invite members"
  on public.clipcanva_project_invites;
create policy "Project editors can invite members"
  on public.clipcanva_project_invites
  for insert
  to authenticated
  with check (
    inviter_id = (select auth.uid())
    and invitee_id <> (select auth.uid())
    and public.clipcanva_project_role(project_id, array['owner', 'editor'])
  );

drop policy if exists "Invitees can cancel or decline invitations"
  on public.clipcanva_project_invites;
create policy "Invitees can cancel or decline invitations"
  on public.clipcanva_project_invites
  for delete
  to authenticated
  using (
    invitee_id = (select auth.uid())
    or public.clipcanva_project_role(project_id, array['owner'])
  );

create or replace function public.accept_clipcanva_project_invite(invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.clipcanva_project_invites%rowtype;
begin
  select * into invitation
  from public.clipcanva_project_invites
  where id = invite_id and invitee_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  insert into public.clipcanva_project_members (project_id, user_id, role)
  values (invitation.project_id, invitation.invitee_id, invitation.role)
  on conflict (project_id, user_id) do nothing;

  delete from public.clipcanva_project_invites where id = invitation.id;
  return invitation.project_id;
end;
$$;

create or replace function public.ensure_clipcanva_profile()
returns public.clipcanva_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.clipcanva_profiles;
begin
  insert into public.clipcanva_profiles (user_id, username, display_name)
  values (
    (select auth.uid()),
    'member-' || left(replace((select auth.uid())::text, '-', ''), 16),
    left(
      coalesce(
        nullif(btrim(auth.jwt() -> 'user_metadata' ->> 'display_name'), ''),
        'Clipcanva member'
      ),
      60
    )
  )
  on conflict (user_id) do nothing;

  select * into profile
  from public.clipcanva_profiles
  where user_id = (select auth.uid());
  return profile;
end;
$$;

revoke all on function public.create_clipcanva_project(text) from public, anon;
grant execute on function public.create_clipcanva_project(text) to authenticated;
revoke all on function public.accept_clipcanva_project_invite(uuid) from public, anon;
grant execute on function public.accept_clipcanva_project_invite(uuid) to authenticated;
revoke all on function public.ensure_clipcanva_profile() from public, anon;
grant execute on function public.ensure_clipcanva_profile() to authenticated;
revoke all on function public.clipcanva_project_role(uuid, text[]) from public, anon;
grant execute on function public.clipcanva_project_role(uuid, text[]) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'clipcanva-public-assets',
  'clipcanva-public-assets',
  true,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view published Clipcanva images"
  on storage.objects;
create policy "Anyone can view published Clipcanva images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'clipcanva-public-assets');

drop policy if exists "Users can upload their own published Clipcanva images"
  on storage.objects;
create policy "Users can upload their own published Clipcanva images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'clipcanva-public-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update their own published Clipcanva images"
  on storage.objects;
create policy "Users can update their own published Clipcanva images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'clipcanva-public-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'clipcanva-public-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their own published Clipcanva images"
  on storage.objects;
create policy "Users can delete their own published Clipcanva images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'clipcanva-public-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Project members can view their Clipcanva images"
  on storage.objects;
create policy "Project members can view their Clipcanva images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'clipcanva-assets'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (
        (storage.foldername(name))[1] = 'projects'
        and public.clipcanva_project_role(
          ((storage.foldername(name))[2])::uuid,
          array['owner', 'editor', 'viewer']
        )
      )
    )
  );

drop policy if exists "Project editors can upload their Clipcanva images"
  on storage.objects;
create policy "Project editors can upload their Clipcanva images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = 'projects'
    and public.clipcanva_project_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'editor']
    )
  );

drop policy if exists "Project editors can update their Clipcanva images"
  on storage.objects;
create policy "Project editors can update their Clipcanva images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = 'projects'
    and public.clipcanva_project_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'editor']
    )
  )
  with check (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = 'projects'
    and public.clipcanva_project_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'editor']
    )
  );

drop policy if exists "Project editors can delete their Clipcanva images"
  on storage.objects;
create policy "Project editors can delete their Clipcanva images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = 'projects'
    and public.clipcanva_project_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'editor']
    )
  );

grant select on public.clipcanva_profiles to anon, authenticated;
grant insert, update on public.clipcanva_profiles to authenticated;
grant select on public.clipcanva_public_canvases to anon, authenticated;
grant insert, update, delete on public.clipcanva_public_canvases to authenticated;
grant select, delete on public.clipcanva_projects to authenticated;
grant update (data, updated_at) on public.clipcanva_projects to authenticated;
grant select, delete on public.clipcanva_project_members to authenticated;
grant select, insert, delete on public.clipcanva_project_invites to authenticated;
