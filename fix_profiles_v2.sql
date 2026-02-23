-- IMPROVED TRIGGER: Handles both new users AND re-creation after deletion
-- This uses UPSERT logic to ensure profile exists even if user logs in after being deleted

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Use INSERT ... ON CONFLICT DO UPDATE to handle both new and returning users
  insert into public.profiles (id, email, full_name, avatar_url, plan, free_generations_used_total, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'free',
    0,
    false
  )
  on conflict (id) do update set
    email = EXCLUDED.email,
    full_name = coalesce(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = coalesce(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  
  return new;
end;
$$;

-- Drop and recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- BACKFILL: Create profiles for existing users who don't have one
insert into public.profiles (id, email, full_name, avatar_url, plan, free_generations_used_total, is_admin)
select 
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User'),
  coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', ''),
  'free',
  0,
  false
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
