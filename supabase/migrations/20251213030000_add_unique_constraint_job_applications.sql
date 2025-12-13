-- Add unique constraint to prevent duplicate applications per user per job
ALTER TABLE job_applications
ADD CONSTRAINT job_applications_job_user_unique UNIQUE (job_id, user_id);
