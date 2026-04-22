-- ─────────────────────────────────────────
-- TikTok Affiliate Analytics — Database Schema
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  niche TEXT CHECK (niche IN ('health_wellness', 'beauty', 'fitness', 'kitchen', 'pet', 'tech', 'fashion', 'home', 'other')),
  tiktok_connected BOOLEAN DEFAULT FALSE,
  tiktok_username TEXT,
  tiktok_access_token TEXT,
  tiktok_refresh_token TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TIKTOK VIDEOS (cached from API)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tiktok_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tiktok_video_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  comment_count BIGINT DEFAULT 0,
  share_count BIGINT DEFAULT 0,
  play_count BIGINT DEFAULT 0,
  duration INTEGER,
  cover_image_url TEXT,
  hashtags TEXT[],
  create_time BIGINT,
  -- AI analyzed fields
  hook_text TEXT,
  hook_type TEXT,
  hook_score INTEGER CHECK (hook_score >= 1 AND hook_score <= 10),
  estimated_gmv DECIMAL(10,2),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tiktok_video_id)
);

-- ─────────────────────────────────────────
-- HOOK ANALYSES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hook_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES tiktok_videos(id) ON DELETE CASCADE,
  hook_text TEXT NOT NULL,
  hook_type TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  strengths TEXT[],
  weaknesses TEXT[],
  suggested_rewrite TEXT,
  compliance_flags TEXT[],
  niche_relevance INTEGER CHECK (niche_relevance >= 1 AND niche_relevance <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- COMPETITORS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tiktok_username TEXT NOT NULL,
  display_name TEXT,
  follower_count BIGINT,
  niche TEXT,
  is_tracking BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tiktok_username)
);

-- ─────────────────────────────────────────
-- PERFORMANCE SNAPSHOTS (daily cached metrics)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  followers BIGINT DEFAULT 0,
  follower_delta INTEGER DEFAULT 0,
  estimated_gmv DECIMAL(10,2) DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ─────────────────────────────────────────
-- CONTENT SCRIPTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  hook_type TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('TOF', 'MOF', 'BOF')),
  script TEXT NOT NULL,
  product_name TEXT,
  niche TEXT,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted')),
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_user_id ON tiktok_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_videos_create_time ON tiktok_videos(create_time DESC);
CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_user_date ON performance_snapshots(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_content_scripts_user_id ON content_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_content_scripts_scheduled ON content_scripts(scheduled_for);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (users only see their own data)
-- ─────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hook_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scripts ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER content_scripts_updated_at BEFORE UPDATE ON content_scripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
