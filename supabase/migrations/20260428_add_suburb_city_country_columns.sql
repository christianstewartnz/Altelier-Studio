-- Split location: suburb, city, and auto-detected country (Australia vs New Zealand)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS suburb text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text;
