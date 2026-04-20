-- Allow null so we can distinguish "never explicitly set" (AI-generated)
-- from "explicitly removed" (false) or "explicitly added" (true).
alter table concepts
  alter column location_added drop not null,
  alter column location_added drop default,
  alter column location_added set default null;

-- Blank out the false defaults so existing AI-generated concepts
-- fall through to the lines[1] heuristic on the frontend.
update concepts set location_added = null where location_added = false;
