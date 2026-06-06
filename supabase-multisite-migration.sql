-- ─────────────────────────────────────────────────────────────────────────────
-- Optic: Multi-site migration
-- Run this in the Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Migrate existing site_ids from clients → sites
-- This preserves the UUIDs so existing conversations still link up
INSERT INTO sites (id, user_id, created_at)
SELECT site_id, user_id, NOW()
FROM clients
WHERE site_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Add subscription columns to clients (account-level)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS plan               TEXT        NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS trial_ends_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;

-- 4. Enable RLS on sites table
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sites"
  ON sites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sites"
  ON sites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sites"
  ON sites FOR UPDATE
  USING (user_id = auth.uid());

-- 5. Update conversations RLS to scope via sites table
-- Drop the old policy (adjust the name if yours is different)
DROP POLICY IF EXISTS "Users can only see their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- 6. Update knowledge_entries RLS similarly (if it has site_id column)
DROP POLICY IF EXISTS "Users can view own knowledge" ON knowledge_entries;
DROP POLICY IF EXISTS "Users can only see their own knowledge" ON knowledge_entries;

CREATE POLICY "Users can view own knowledge"
  ON knowledge_entries FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own knowledge"
  ON knowledge_entries FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );
