-- Admin monitoring + reliable user generation counters
-- Run this once in Supabase SQL editor.

begin;

-- 1) Let admins read all resume generations (RLS-safe).
drop policy if exists "Admins can view all generations." on public.resume_generations;
create policy "Admins can view all generations."
on public.resume_generations
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

-- 2) Let admins manage profiles (needed for admin panel actions).
drop policy if exists "Admins can update any profile." on public.profiles;
create policy "Admins can update any profile."
on public.profiles
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

drop policy if exists "Admins can delete profiles." on public.profiles;
create policy "Admins can delete profiles."
on public.profiles
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

-- 3) Persist total generated resumes per user directly in profiles.
alter table public.profiles
  add column if not exists total_generations_used int not null default 0;

-- Backfill historical counts.
update public.profiles p
set total_generations_used = stats.total
from (
  select user_id, count(*)::int as total
  from public.resume_generations
  group by user_id
) as stats
where p.id = stats.user_id;

update public.profiles
set total_generations_used = 0
where total_generations_used is null;

-- Keep count in sync on every new generation.
create or replace function public.increment_total_generations_used()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set total_generations_used = coalesce(total_generations_used, 0) + 1
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_resume_generation_created on public.resume_generations;
create trigger on_resume_generation_created
after insert on public.resume_generations
for each row
execute procedure public.increment_total_generations_used();

-- 4) Helpful index for admin activity view.
create index if not exists idx_resume_generations_user_created_at
on public.resume_generations (user_id, created_at desc);

commit;
