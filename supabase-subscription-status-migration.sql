-- ─────────────────────────────────────────────────────────────────────────────
-- Optic: Polar subscription status migration
-- Run this in the Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Tracks the live status of a customer's Polar subscription
-- (e.g. 'active', 'canceled', 'past_due'). `plan` continues to drive
-- feature access; this column is for display/grace-period logic.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;
