-- Add columns to exports table needed by the export package route.
-- The table already exists (with concept_id unique constraint); this is additive.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exports' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.exports ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exports' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.exports ADD COLUMN project_id UUID REFERENCES public.projects(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exports' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE public.exports ADD COLUMN file_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exports' AND column_name = 'downloaded_at'
  ) THEN
    ALTER TABLE public.exports ADD COLUMN downloaded_at TIMESTAMPTZ;
  END IF;
END $$;

-- Storage bucket for brand export ZIPs (private, 100 MB per file).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('exports', 'exports', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users may upload only into their own user-id folder.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'exports_insert_own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY exports_insert_own ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = 'exports'
          AND (storage.foldername(name))[1] = auth.uid()::text
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'exports_select_own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY exports_select_own ON storage.objects
        FOR SELECT TO authenticated
        USING (
          bucket_id = 'exports'
          AND (storage.foldername(name))[1] = auth.uid()::text
        )
    $policy$;
  END IF;
END $$;
