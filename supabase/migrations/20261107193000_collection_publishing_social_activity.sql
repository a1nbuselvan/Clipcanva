alter table public.clipcanva_public_canvases
  add column if not exists collection_id text,
  add column if not exists collection_name text;

update public.clipcanva_public_canvases
set
  collection_id = coalesce(data -> 'colls' -> 0 ->> 'id', 'legacy'),
  collection_name = coalesce(data -> 'colls' -> 0 ->> 'name', 'Untitled'),
  is_public = false
where collection_id is null;

alter table public.clipcanva_public_canvases
  alter column collection_id set not null,
  alter column collection_name set not null;

alter table public.clipcanva_public_canvases
  drop constraint if exists clipcanva_public_canvases_user_id_key;
alter table public.clipcanva_public_canvases
  add constraint clipcanva_public_canvases_user_collection_key
  unique (user_id, collection_id);

alter table public.clipcanva_projects
  add column if not exists visibility text not null default 'private'
  check (visibility in ('private', 'public'));

create or replace function public.clipcanva_project_is_public(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clipcanva_projects project
    where project.id = target_project
      and project.visibility = 'public'
  );
$$;

revoke all on function public.clipcanva_project_is_public(uuid) from public;
grant execute on function public.clipcanva_project_is_public(uuid) to anon, authenticated;
grant execute on function public.clipcanva_project_role(uuid, text[]) to anon;

drop policy if exists "Project members can view their projects"
  on public.clipcanva_projects;
create policy "Project members and public visitors can view projects"
  on public.clipcanva_projects
  for select
  to anon, authenticated
  using (
    visibility = 'public'
    or public.clipcanva_project_role(id, array['owner', 'editor', 'viewer'])
  );
grant select on public.clipcanva_projects to anon;

drop function if exists public.create_clipcanva_project(text);
create function public.create_clipcanva_project(
  project_name text,
  project_visibility text default 'private'
)
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
  if project_visibility not in ('private', 'public') then
    raise exception 'Choose private or public visibility';
  end if;

  insert into public.clipcanva_projects (owner_id, name, visibility)
  values ((select auth.uid()), btrim(project_name), project_visibility)
  returning id into created_project;

  insert into public.clipcanva_project_members (project_id, user_id, role)
  values (created_project, (select auth.uid()), 'owner');
  return created_project;
end;
$$;

revoke all on function public.create_clipcanva_project(text, text) from public, anon;
grant execute on function public.create_clipcanva_project(text, text) to authenticated;

create or replace function public.set_clipcanva_project_visibility(
  target_project uuid,
  new_visibility text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new_visibility not in ('private', 'public') then
    raise exception 'Choose private or public visibility';
  end if;
  if not public.clipcanva_project_role(target_project, array['owner']) then
    raise exception 'Only the project owner can change visibility';
  end if;

  update public.clipcanva_projects
  set visibility = new_visibility, updated_at = now()
  where id = target_project;
end;
$$;

revoke all on function public.set_clipcanva_project_visibility(uuid, text) from public, anon;
grant execute on function public.set_clipcanva_project_visibility(uuid, text) to authenticated;

drop policy if exists "Project members can view their Clipcanva images"
  on storage.objects;
create policy "Project members and public visitors can view project images"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'clipcanva-assets'
    and (storage.foldername(name))[1] = 'projects'
    and (
      public.clipcanva_project_is_public(
        ((storage.foldername(name))[2])::uuid
      )
      or public.clipcanva_project_role(
        ((storage.foldername(name))[2])::uuid,
        array['owner', 'editor', 'viewer']
      )
    )
  );

create table if not exists public.clipcanva_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followed_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create index if not exists clipcanva_follows_followed_idx
  on public.clipcanva_follows (followed_id, created_at desc);

alter table public.clipcanva_follows enable row level security;

drop policy if exists "Follow relationships are publicly readable"
  on public.clipcanva_follows;
create policy "Follow relationships are publicly readable"
  on public.clipcanva_follows
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can follow from their own account"
  on public.clipcanva_follows;
create policy "Users can follow from their own account"
  on public.clipcanva_follows
  for insert
  to authenticated
  with check (
    follower_id = (select auth.uid())
    and follower_id <> followed_id
  );

drop policy if exists "Users can unfollow from their own account"
  on public.clipcanva_follows;
create policy "Users can unfollow from their own account"
  on public.clipcanva_follows
  for delete
  to authenticated
  using (follower_id = (select auth.uid()));

grant select on public.clipcanva_follows to anon, authenticated;
grant insert, delete on public.clipcanva_follows to authenticated;

create table if not exists public.clipcanva_activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  contribution_count integer not null default 0 check (contribution_count >= 0),
  primary key (user_id, activity_date)
);

alter table public.clipcanva_activity_days enable row level security;

drop policy if exists "Contribution activity is public"
  on public.clipcanva_activity_days;
create policy "Contribution activity is public"
  on public.clipcanva_activity_days
  for select
  to anon, authenticated
  using (true);

grant select on public.clipcanva_activity_days to anon, authenticated;

create or replace function public.record_clipcanva_activity()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to record activity';
  end if;

  insert into public.clipcanva_activity_days as activity
    (user_id, activity_date, contribution_count)
  values ((select auth.uid()), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, activity_date)
  do update set contribution_count =
    activity.contribution_count + 1;
end;
$$;

revoke all on function public.record_clipcanva_activity() from public, anon;
grant execute on function public.record_clipcanva_activity() to authenticated;
