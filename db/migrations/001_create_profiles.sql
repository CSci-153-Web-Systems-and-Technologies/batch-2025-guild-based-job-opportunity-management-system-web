-- 001_create_profiles.sql
-- Migration: create a production-ready `profiles` table, trigger to keep
-- profiles in sync with `auth.users`, housekeeping triggers, indexes and RLS.

-- NOTE: Run this as a DB superuser or through the Supabase SQL editor.

-- Enable required extension for UUID generation if not already enabled
create extension if not exists pgcrypto;

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique,
  email text,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  role text default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists profiles_auth_id_idx on public.profiles(auth_id);
create index if not exists profiles_email_idx on public.profiles(email);

-- Trigger to auto-update `updated_at`
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Sync profiles when new auth.users row is created
-- This inserts a profile row when a new user signs up, preserving email and blank names.
create or replace function public.sync_profile_from_auth()
returns trigger as $$
begin
  -- If a profile already exists for this auth_id, do nothing
  insert into public.profiles (auth_id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (auth_id) do update set email = coalesce(excluded.email, public.profiles.email);
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if present, then create trigger on auth.users
-- Note: creating triggers on auth schema requires migration to run with sufficient privileges.
begin;
  drop trigger if exists auth_user_created on auth.users;
  create trigger auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.sync_profile_from_auth();
commit;

-- Row-Level Security (RLS)
-- Enable RLS and add safe, minimal policies so users can access only their own profile.
alter table public.profiles enable row level security;

-- Allow users to select their own profile
create policy "Profiles: allow select for owner" on public.profiles
  for select using (auth.uid() = auth_id);

-- Allow users to insert their own profile (useful for direct upserts)
create policy "Profiles: allow insert for owner" on public.profiles
  for insert with check (auth.uid() = auth_id);

-- Allow users to update their own profile
create policy "Profiles: allow update for owner" on public.profiles
  for update using (auth.uid() = auth_id) with check (auth.uid() = auth_id);

-- Allow the service role (role = 'service_role') or authenticated server processes
-- to bypass policies if needed by applying them from server side using the service key.

-- Safe read for admin role (if you use custom roles)
create policy "Profiles: allow select for admin" on public.profiles
  for select using (auth.role() = 'admin');

-- Helpful view for joining auth.users with profiles (optional)
create or replace view public.user_profiles as
select
  u.id as auth_id,
  u.email,
  p.id as profile_id,
  p.first_name,
  p.last_name,
  p.display_name,
  p.avatar_url,
  p.metadata,
  p.role,
  p.created_at,
  p.updated_at
from auth.users u
left join public.profiles p on p.auth_id = u.id;

-- Grant typical usage to authenticated role (this is permissive for the view only)
grant select on public.user_profiles to authenticated;

-- End of migration
