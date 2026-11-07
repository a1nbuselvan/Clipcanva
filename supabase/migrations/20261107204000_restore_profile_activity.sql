create table if not exists public.clipcanva_activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  contribution_count integer not null default 0
    check (contribution_count >= 0),
  primary key (user_id, activity_date)
);

alter table public.clipcanva_activity_days enable row level security;

drop policy if exists "Activity is publicly readable"
  on public.clipcanva_activity_days;
create policy "Activity is publicly readable"
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
declare
  active_user uuid := (select auth.uid());
  current_day date := (now() at time zone 'utc')::date;
begin
  if active_user is null then
    raise exception 'Sign in to record activity';
  end if;

  insert into public.clipcanva_activity_days (
    user_id,
    activity_date,
    contribution_count
  )
  values (active_user, current_day, 1)
  on conflict (user_id, activity_date)
  do update set contribution_count =
    public.clipcanva_activity_days.contribution_count + 1;
end;
$$;

revoke all on function public.record_clipcanva_activity() from public, anon;
grant execute on function public.record_clipcanva_activity() to authenticated;
