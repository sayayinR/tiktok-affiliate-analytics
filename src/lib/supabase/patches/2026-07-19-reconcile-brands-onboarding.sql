-- ─────────────────────────────────────────
-- PATCH: Reconcile stale schema.sql with live app code
-- (users.niches/goals/formats/onboarded, brands table,
--  tiktok_videos.brand_id, drop orphaned competitors)
--
-- Run ONCE, manually, in the Supabase SQL Editor.
-- Safe to re-run — every statement is idempotent (IF NOT EXISTS / IF EXISTS).
-- Date: 2026-07-19
-- ─────────────────────────────────────────

-- 1. USERS — add the onboarding fields the app already reads/writes
--    (src/app/api/onboarding/route.ts, src/app/dashboard/layout.tsx)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS niches TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS formats TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Drop the legacy singular `niche` column — superseded by niches[],
-- nothing in the app reads or writes it anymore.
ALTER TABLE users DROP COLUMN IF EXISTS niche;

-- 2. BRANDS — new table backing src/app/api/brands/route.ts
--    and src/app/dashboard/brands/page.tsx
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TIKTOK_VIDEOS — brand_id used for keyword auto-tagging
--    in src/app/api/brands/route.ts (POST handler)
ALTER TABLE tiktok_videos
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- 4. Drop the orphaned competitors table — no live code queries it
--    (only a dead href string in QuickActions.tsx), and competitor
--    tracking was explicitly removed from the roadmap (see CLAUDE.md
--    "Features Removed from Roadmap"). No other table has an FK
--    pointing at competitors, so this is safe with no CASCADE needed.
DROP TABLE IF EXISTS competitors;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_brand_id ON tiktok_videos(brand_id);

-- 6. Row level security — enabled with no explicit policies, matching
--    every other table in schema.sql (all app DB access goes through
--    the service-role client in src/lib/supabase/client.ts, which
--    bypasses RLS entirely; RLS is enabled here only for consistency).
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
