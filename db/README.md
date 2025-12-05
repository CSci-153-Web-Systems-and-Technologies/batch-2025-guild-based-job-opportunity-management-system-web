This folder contains SQL migrations and notes for the project's database.

How to apply the migrations

Using the Supabase SQL editor
1. Open your Supabase project.
2. Go to "SQL" and create a new query.
3. Copy the contents of `db/migrations/001_create_profiles.sql` and run it.

Using the Supabase CLI
1. Install the Supabase CLI and login: `supabase login`.
2. From the repo root run:

   supabase db remote set <YOUR_DB_URL>
   supabase db push --file db/migrations/001_create_profiles.sql

Using psql (direct to Postgres)
1. Ensure you have an admin connection string with privileges to create extensions and triggers.
2. Run:

   psql postgresql://postgres:[PASSWORD]@db.gyykjtuqblihqblrhkwd.supabase.co:5432/postgres -f db/migrations/001_create_profiles.sql

Notes
- The migration enables `pgcrypto` if not present for `gen_random_uuid()`.
- The migration creates a trigger to synchronize `profiles` from `auth.users`.
- Running this migration requires sufficient privileges (superuser) for creating triggers on `auth.users`.
- After applying migrations, test RLS policies by signing in as a regular user and ensuring you can only access your own profile.
