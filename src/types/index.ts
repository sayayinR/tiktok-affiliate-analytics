// ─────────────────────────────────────────
// Core Domain Types
// ─────────────────────────────────────────

export type Plan = 'free' | 'pro' | 'enterprise'

export type Niche =
  | 'health_wellness'
  | 'beauty'
  | 'fitness'
  | 'kitchen'
  | 'pet'
  | 'tech'
  | 'fashion'
  | 'home'
  | 'other'

export interface User {
  id: string
  clerkId: string
  email: string
  plan: Plan
  niche: Niche | null
  tiktokConnected: boolean
  tiktokUsername: string | null
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────
// TikTok Data Types
// ─────────────────────────────────────────

export interface TikTokProfile {
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  likesCount: number
  videoCount: number
  avatarUrl: string
  bioDescription: string
  isVerified: boolean
}

export interface TikTokVideo {
  id: string
  title: string
  description: string
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  playCount: number
  duration: number
  coverImageUrl: string
  createTime: number
  hashtags: string[]
  // Computed by our AI layer
  hookScore?: number
  hookType?: HookType
  hookText?: string
  estimatedGmv?: number
}

export type HookType =
  | 'fear'
  | 'ego'
  | 'curiosity'
  | 'social_proof'
  | 'controversy'
  | 'demo'
  | 'unknown'

export interface HookAnalysis {
  videoId: string
  hookText: string
  hookType: HookType
  score: number // 1-10
  strengths: string[]
  weaknesses: string[]
  suggestedRewrite: string
  complianceFlags: string[]
  nicheRelevance: number // 1-10
}

// ─────────────────────────────────────────
// Analytics Types
// ─────────────────────────────────────────

export interface PerformanceMetrics {
  userId: string
  period: '7d' | '28d' | '60d' | '90d'
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  followerGrowth: number
  avgViewsPerVideo: number
  avgEngagementRate: number
  topPerformingHookType: HookType
  estimatedGmv: number
  videoCount: number
  fetchedAt: string
}

export interface DailyMetric {
  date: string
  views: number
  likes: number
  followers: number
  gmv: number
}

// ─────────────────────────────────────────
// Competitor Types
// ─────────────────────────────────────────

export interface Competitor {
  id: string
  userId: string
  tiktokUsername: string
  displayName: string
  followerCount: number
  niche: Niche
  isTracking: boolean
  lastSyncedAt: string | null
  createdAt: string
}

export interface CompetitorInsight {
  competitorUsername: string
  topHookTypes: HookType[]
  avgEngagementRate: number
  postingFrequency: number // videos per day
  topHashtags: string[]
  recentVideos: TikTokVideo[]
  growthRate: number // % over last 30 days
}

// ─────────────────────────────────────────
// Content Planner Types
// ─────────────────────────────────────────

export type ContentStage = 'TOF' | 'MOF' | 'BOF'

export interface ContentScript {
  id: string
  userId: string
  title: string
  hook: string
  hookType: HookType
  stage: ContentStage
  script: string
  productName: string
  niche: Niche
  scheduledFor: string | null
  status: 'draft' | 'scheduled' | 'posted'
  aiGenerated: boolean
  createdAt: string
}

// ─────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
