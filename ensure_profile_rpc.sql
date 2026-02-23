-- Function to ensure a profile exists for a user
-- This is called from the Next.js auth callback to handle cases where
-- a user exists in auth.users but deleted their public profile.

create or replace function public.ensure_user_profile(
    user_id uuid,
    user_email text,
    user_full_name text default null,
    user_avatar_url text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url, plan, free_generations_used_total)
    values (
        user_id,
        user_email,
        coalesce(user_full_name, 'User'),
        coalesce(user_avatar_url, ''),
        'free',
        0
    )
    on conflict (id) do nothing;
end;
$$;
