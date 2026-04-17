-- Ensure webhook upserts can safely conflict on exports.concept_id.
-- The webhook uses: upsert(..., { onConflict: "concept_id" }).
-- This requires a UNIQUE or PRIMARY KEY constraint on concept_id.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.exports
    GROUP BY concept_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add unique constraint: duplicate concept_id values exist in public.exports';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exports_concept_id_key'
      AND conrelid = 'public.exports'::regclass
  ) THEN
    ALTER TABLE public.exports
      ADD CONSTRAINT exports_concept_id_key UNIQUE (concept_id);
  END IF;
END $$;
