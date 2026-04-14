ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
