-- ─────────────────────────────────────────
-- PATCH: Add share_url to tiktok_videos
--
-- TikTok's video.list API already includes `share_url` in the requested
-- fields (src/lib/tiktok/auth.ts), but it was never persisted. Lets users
-- open the actual TikTok video in a new tab to identify it visually,
-- independent of cover_image_url's ~24h signed-URL expiry.
--
-- Run ONCE, manually, in the Supabase SQL Editor.
-- Safe to re-run — ADD COLUMN IF NOT EXISTS is idempotent.
-- Date: 2026-07-22
-- ─────────────────────────────────────────

ALTER TABLE tiktok_videos
  ADD COLUMN IF NOT EXISTS share_url TEXT;
