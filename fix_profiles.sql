-- 1. DROP and RECREATE the Trigger to be 100% sure
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan, free_generations_used_total)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'free',
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. BACKFILL existing users who are missing a profile
-- This inserts a profile for any user in auth.users that doesn't exist in profiles
insert into public.profiles (id, email, full_name, avatar_url, plan, free_generations_used)
select 
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Existing User'),
  coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', ''),
  'free',
  0
from auth.users
where id not in (select id from public.profiles);
