create unique index if not exists clipcanva_profiles_username_lower_key
  on public.clipcanva_profiles (lower(username));
