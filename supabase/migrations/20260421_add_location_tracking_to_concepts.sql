alter table concepts
  add column if not exists location_added boolean not null default false,
  add column if not exists original_name_before_location text;
