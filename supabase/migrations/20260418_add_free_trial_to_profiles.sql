-- Add free-trial flags to profiles.
-- is_free_trial: stamped at signup when user comes in via ?trial=true.
-- free_trial_used: atomically flipped to true inside /api/generate at the
-- start of the trial user's first free generation (single source of truth
-- for trial consumption; prevents the double-generate race).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_free_trial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_trial_used boolean NOT NULL DEFAULT false;
