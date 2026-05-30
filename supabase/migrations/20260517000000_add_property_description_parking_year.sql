-- Add description, parking, and year_built columns to properties table
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS parking integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS year_built integer;
