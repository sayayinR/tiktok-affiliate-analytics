# AffiliateIQ — Claude Code Context

## Project Overview
AffiliateIQ is a TikTok Shop affiliate analytics platform. It helps creators track their own content performance across all their products and videos in one place. It is NOT a competitor tracking tool — focus is entirely on the user's own analytics.

## Core Philosophy
- Build features only after validating data availability from the API
- Never promise a feature that requires data TikTok does not expose
- Every feature must solve a real creator pain point
- Keep it simple — one clear value per feature

---

## Tech Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Auth: Clerk (v5) — import from @clerk/nextjs/server for server components
- Database: Supabase (PostgreSQL)
- Cache: Upstash Redis (not yet implemented)
- AI: Anthropic Claude API (@anthropic-ai/sdk)
- Charts: Recharts
- Deployment: Vercel
- Domain: www.thewebmyster.com
- Repo: github.com/sayayinR/tiktok-affiliate-analytics

---

## Project Structure

src/
  app/
    auth/login/[[...rest]]/     - Clerk SignIn (routing="hash")
    auth/register/[[...rest]]/  - Clerk SignUp (routing="hash")
    dashboard/
      layout.tsx                - Protected layout, checks onboarded status
      overview/                 - Main dashboard
      brands/                   - Brands & Products section
      hooks/                    - Hook Analyzer (not yet built)
      content-planner/          - Content Planner (not yet built)
    onboarding/                 - 4-step onboarding flow
    legal/terms/                - Terms of Service (public)
    legal/privacy/              - Privacy Policy (public)
    api/
      auth/tiktok/              - TikTok OAuth initiation
      auth/tiktok/callback/     - TikTok OAuth callback
      auth/tiktok/debug/        - Debug route (remove in production)
      tiktok/sync/              - Sync videos from TikTok API
      tiktok/videos/            - Fetch videos from Supabase
      brands/                   - CRUD for brands
      onboarding/               - Save onboarding data
      health/                   - Health check (public)
  components/
    layout/
      Sidebar.tsx               - Navigation sidebar
      TopBar.tsx                - Top bar with TikTok connection status
    dashboard/
      MetricCards.tsx           - Overview metric cards (mock data still)
      PerformanceChart.tsx      - Area charts (mock data still)
      TopVideosTable.tsx        - Real video data from Supabase
      QuickActions.tsx          - Quick action buttons
      SyncButton.tsx            - Sync TikTok videos button
  lib/
    supabase/client.ts          - Supabase client + admin
    supabase/schema.sql         - Full database schema
    tiktok/auth.ts              - TikTok OAuth + API functions
    utils/index.ts              - Shared utilities
  types/index.ts                - All TypeScript types

---

## Database Schema (Supabase)

users
  - clerk_id, email, plan, niches[], goals[], formats[]
  - tiktok_connected, tiktok_username, tiktok_access_token
  - tiktok_refresh_token, onboarded

tiktok_videos
  - user_id, tiktok_video_id, description, view_count
  - like_count, comment_count, share_count, duration
  - cover_image_url, create_time, hook_text, hook_type
  - hook_score, brand_id

brands
  - user_id, name, keywords[], color

hook_analyses
  - user_id, video_id, hook_text, hook_type, score
  - strengths, weaknesses, suggested_rewrite, compliance_flags

performance_snapshots
  - user_id, date, views, likes, followers, estimated_gmv

content_scripts
  - user_id, title, hook, stage (TOF/MOF/BOF), script
  - product_name, niche, status

---

## TikTok API — CRITICAL LIMITATIONS
Always validate API availability before building any feature.

### What IS available via TikTok API (after OAuth):
- Video list: id, description, view_count, like_count, comment_count, share_count, duration, cover_image_url, create_time
- User profile: display_name, avatar_url, follower_count, video_count
- User stats: likes_count, following_count

### What is NOT available via TikTok API:
- NO Click Through Rate (CTR) — not exposed in any API scope
- NO Average watch time — not exposed in any API scope
- NO Video retention (3s, 10s) — not exposed in any API scope
- NO Exposure Plus / GMV Max data — TikTok Shop internal only
- NO Competitor private analytics — only public data via scraping

### TikTok API Scopes approved (sandbox):
- user.info.basic
- user.info.profile
- user.info.stats
- video.list

### TikTok OAuth Setup:
- Sandbox app: AffiliateIQ-Dev
- Client key: stored in .env.local as TIKTOK_CLIENT_KEY
- Redirect URI: https://www.thewebmyster.com/api/auth/tiktok/callback
- Auth URL: https://www.tiktok.com/v2/auth/authorize/
- Token URL: https://open.tiktokapis.com/v2/oauth/token/
- Video list endpoint: https://open.tiktokapis.com/v2/video/list/
- User info endpoint: https://open.tiktokapis.com/v2/user/info/
- NOTE: redirect_uri is hardcoded in auth.ts because NEXT_PUBLIC_APP_URL was unreliable in Vercel

### Token Refresh:
- Access tokens expire in 24 hours
- Refresh token logic NOT yet implemented
- Without refresh, users need to reconnect TikTok daily

---

## Authentication Patterns

Server components and API routes — always use:
  import { auth } from '@clerk/nextjs/server'
  const { userId } = await auth()

Client components:
  import { useUser } from '@clerk/nextjs'
  const { user } = useUser()

### Public Routes in middleware.ts:
  /auth/login(.*)
  /auth/register(.*)
  /api/health(.*)
  /api/auth/tiktok/callback(.*)
  /onboarding(.*)
  /legal(.*)
  /tiktok(.*)

---

## Coding Patterns

### API Routes — always follow this structure:
  1. Get userId from auth()
  2. Return 401 if not authenticated
  3. Get user record from Supabase using clerk_id
  4. Perform operation
  5. Wrap everything in try/catch
  6. Return appropriate NextResponse.json()

### Components:
- Use 'use client' only when needed (useState, useEffect, event handlers)
- Server components by default
- Always handle loading and empty states
- Use cn() from @/lib/utils for className merging

### Styling:
- Dark theme: background #0a0a0a, card #111820
- Brand color: #00d4ff (cyan) — use text-brand, bg-brand
- Tailwind only — no inline styles except dynamic colors
- Border: border-border
- Muted text: text-muted-foreground

---

## Environment Variables

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard/overview
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/overview
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
NEXT_PUBLIC_APP_URL=https://www.thewebmyster.com
ANTHROPIC_API_KEY (not yet implemented)
STRIPE_SECRET_KEY (not yet implemented)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (not yet implemented)

---

## Features Built
- Clerk authentication (login/register/onboarding)
- 4-step onboarding (niches, formats, goals, TikTok connect)
- TikTok OAuth flow (sandbox mode)
- Video sync from TikTok API (20 videos per sync)
- Top Videos table with real data
- Brands & Products page with auto-tagging by keyword
- Dashboard overview with mock metric cards and charts
- Deployed to Vercel + thewebmyster.com domain

## Features In Progress
- Brands detail page (individual brand video list)
- Full video archive (paginate all videos beyond 20)

## Features Planned
- Search & Filter across all videos (by keyword, product, date range)
- Traction/Resurrection detection (old videos gaining views alert)
- Hook Analyzer (AI scoring of video hooks)
- Content Planner (TOF/MOF/BOF script queue)
- Token refresh logic (TikTok access tokens expire in 24hrs)
- MetricCards with real data (currently mock)
- Stripe billing (Free/Pro $29/Enterprise $79)
- Watch time + CTR (requires browser extension — NOT available via API)

## Features Removed from Roadmap
- Competitor tracking (not aligned with product focus)
- CTR via API (not available — TikTok does not expose this)
- Watch time via API (not available — TikTok does not expose this)

---

## Known Issues and Tech Debt
1. MetricCards and PerformanceChart still use mock data
2. TikTok token refresh not implemented (tokens expire in 24hrs)
3. Video sync limited to 20 videos (pagination not implemented)
4. Debug route /api/auth/tiktok/debug should be removed in production
5. NEXT_PUBLIC_APP_URL env var unreliable in Vercel — redirect URIs are hardcoded in auth.ts

---

## Feature Validation Checklist
Before building ANY new feature, answer these questions first:
1. What exact data does this feature need?
2. Is that data available from TikTok API? Check docs before building.
3. Is it already in our Supabase tables?
4. If not available via API — what is the alternative?
5. Is the alternative worth building?
6. Only proceed after all questions are answered and confirmed.
