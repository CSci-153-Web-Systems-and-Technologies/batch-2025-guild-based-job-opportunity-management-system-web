# Database Schema Summary

This document records the database tables and their attributes for quick reference.

## profiles
- `id` (UUID)
- `auth_id`
- `email`
- `first_name`
- `last_name`
- `display_name`
- `avatar_url`
- `metadata`
- `role`
- `created_at`
- `updated_at`
- `role_id`

## roles
- `id` BIGINT PRIMARY KEY
- `name` TEXT UNIQUE NOT NULL
- `description` TEXT

## ranks
- `id` BIGINT PRIMARY KEY
- `name` TEXT
- `min_xp` INTEGER
- `max_xp` INTEGER

## jobs
- `id`
- `title`
- `description`
- `category`
- `reward_xp`
- `slots`
- `created_by` (UUID)
- `created_at`
- `updated_at`
- `pay`
- `location`
- `status`
- `deadline`
- `recommended_rank_id`

## job_applications
- `id`
- `job_id` → `jobs.id`
- `user_id` → `profiles.id`
- `status` (applied, accepted, rejected, completed)
- `created_at`

## parties
- `id`
- `name`
- `description`
- `leader_id` (UUID)
- `created_at`

## party_members
- `id` (int)
- `party_id` → `parties.id`
- `user_id` → `profiles.id`
- `role`
- `joined_at`

## user_stats
- `user_id` UUID PRIMARY KEY → `profiles.id`
- `xp` INTEGER DEFAULT 0
- `current_rank_id` BIGINT → `ranks.id`
- `updated_at` TIMESTAMPTZ

---

Notes:
- Keep this file updated when schema migrations are added or changed (see `supabase/migrations`).
- Use the `id`/FK conventions here when writing queries or API endpoints.
