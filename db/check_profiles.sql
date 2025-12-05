-- Diagnostics script for `profiles` implementation
-- Paste this file into the Supabase SQL editor and run. The result set will show
-- which pieces are present/missing and basic info to debug issues.

-- 1) Current user (shows which role runs the script)
select current_user as current_user, session_user as session_user;

-- 2) Does profiles table exist?
select count(*) as profiles_table_exists from pg_tables where schemaname = 'public' and tablename = 'profiles';

-- 3) How many rows in profiles (0 means no profiles created yet)
select count(*) as profiles_row_count from public.profiles;

-- 4) Show up to 5 profile rows (if any)
select * from public.profiles limit 5;

-- 5) Is pgcrypto available (needed for gen_random_uuid)
select exists(select 1 from pg_extension where extname = 'pgcrypto') as pgcrypto_installed;

-- 6) Does gen_random_uuid() work? (will error if extension missing)
select gen_random_uuid() as test_uuid;

-- 7) Triggers defined on public.profiles
select tgname, tgrelid::regclass::text as table_name, pg_get_triggerdef(pg_trigger.oid) as trigger_def
from pg_trigger
join pg_class on pg_trigger.tgrelid = pg_class.oid
where tgrelid::regclass::text = 'public.profiles';

-- 8) Triggers defined on auth.users (sync trigger may be here)
select tgname, tgrelid::regclass::text as table_name, pg_get_triggerdef(pg_trigger.oid) as trigger_def
from pg_trigger
join pg_class on pg_trigger.tgrelid = pg_class.oid
where tgrelid::regclass::text = 'auth.users';

-- 9) Is Row-Level Security enabled for profiles?
select relname, relrowsecurity from pg_class where relname = 'profiles';

-- 10) List policies for profiles (use pg_policies view)
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles';

-- 11) List unique constraints (is auth_id unique?)
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass and contype = 'u';

-- 12) Indexes on profiles
select * from pg_indexes where schemaname = 'public' and tablename = 'profiles';

-- 13) Helpful hint: if profiles table does not exist, run the migration in Supabase
-- SQL editor as a project admin: copy `db/migrations/001_create_profiles.sql` and run it.

-- End of diagnostics
