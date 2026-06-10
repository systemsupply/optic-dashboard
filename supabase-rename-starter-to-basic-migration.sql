-- ─────────────────────────────────────────────────────────────────────────────
-- Optic: rename "starter" plan to "basic"
-- Run this in the Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Update the default for new rows
ALTER TABLE clients
  ALTER COLUMN plan SET DEFAULT 'basic';

-- Update any existing rows still on the old "starter" name
UPDATE clients
  SET plan = 'basic'
  WHERE plan = 'starter';
