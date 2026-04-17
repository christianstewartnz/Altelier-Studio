-- Track project-level payment. Payment now unlocks AI generation
-- (not the per-concept download), so the purchase attaches to the project.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_id text;

CREATE INDEX IF NOT EXISTS projects_paid_at_idx
  ON public.projects (paid_at)
  WHERE paid_at IS NOT NULL;
