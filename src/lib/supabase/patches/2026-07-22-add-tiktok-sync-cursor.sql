-- ─────────────────────────────────────────
-- PATCH: Add resumable pagination cursor for TikTok video sync
-- (src/app/api/tiktok/sync/route.ts, src/lib/tiktok/auth.ts)
--
-- Vercel's Hobby plan hard-caps serverless functions at 60s, which is not
-- enough to paginate a creator's full video history in one request for
-- accounts with more than a few hundred videos. The sync route now stops
-- itself at a soft internal deadline and persists its TikTok `cursor` here
-- so the next sync call resumes instead of restarting from the newest video.
-- NULL = no sync in progress (next call starts fresh from the newest video).
-- Non-NULL = resume pagination from this cursor.
--
-- Run ONCE, manually, in the Supabase SQL Editor.
-- Safe to re-run — ADD COLUMN IF NOT EXISTS is idempotent.
-- Date: 2026-07-22
-- ─────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tiktok_sync_cursor BIGINT;
