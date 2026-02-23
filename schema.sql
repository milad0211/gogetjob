-- ============================================================
-- Reference schema for profiles table (after migration)
-- This file documents the CURRENT expected schema.
-- DO NOT RUN THIS if profiles already exists — use add_billing_cycle.sql instead.
-- ============================================================

create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  free_generations_used_total int default 0,
  plan text default 'free' check (plan in ('free', 'pro')),
  subscription_status text default 'inactive' check (subscription_status in ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  billing_cycle text null check (billing_cycle in ('month', 'year')),
  pro_generations_used_cycle int default 0,
  pro_cycle_started_at timestamp with time zone,
  pro_cycle_ends_at timestamp with time zone,
  pro_access_until timestamp with time zone,
  polar_customer_id text,
  polar_subscription_id text,
  polar_product_id text,
  period_end timestamp with time zone,
  customer_id text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for resume generations
create table resume_generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  job_source text check (job_source in ('url', 'paste', 'text')),
  job_url text,
  job_text text,
  resume_original_text text,
  resume_generated_text text,
  cover_letter_text text,
  analysis_json jsonb,
  status text default 'pending' check (status in ('pending', 'success', 'failed')),
  error_message text,
  output_pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Webhook idempotency table
create table polar_webhook_events (
  id text primary key,
  received_at timestamptz default now(),
  type text,
  subscription_id text
);

-- Enable RLS for resume_generations
alter table resume_generations enable row level security;

create policy "Users can view own generations." on resume_generations
  for select using (auth.uid() = user_id);

create policy "Users can insert own generations." on resume_generations
  for insert with check (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan, free_generations_used_total)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'free', 0
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
