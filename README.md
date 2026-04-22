# TikTok Affiliate Analytics

> Intelligence platform for TikTok Shop affiliates — hook scoring, competitor tracking, GMV correlation, and AI-powered content planning. Works across all niches.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Supabase (Postgres) |
| Auth | Clerk (with TikTok OAuth) |
| Caching | Upstash Redis |
| Billing | Stripe |
| AI Layer | Anthropic Claude API |
| Data APIs | TikTok Display API + EnsembleData (scraping) |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js v18+ (you have v24.11.0 ✅)
- Git (you have v2.53.0 ✅)
- A GitHub account

### 1. Clone the repo

```bash
git clone https://github.com/sayayinR/tiktok-affiliate-analytics.git
cd tiktok-affiliate-analytics
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
copy .env.example .env.local
```

Then open `.env.local` in VS Code and fill in your keys. See **External Services Setup** below.

### 4. Set up the database

- Go to [supabase.com](https://supabase.com) and create a free project
- Open the SQL Editor in your Supabase dashboard
- Copy the contents of `src/lib/supabase/schema.sql` and run it

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Coverage report
npm run test:coverage
```

---

## External Services Setup

### Clerk (Auth)
1. Go to [clerk.com](https://clerk.com) → Create application
2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`
3. In Clerk dashboard → Social Connections → Enable TikTok

### Supabase (Database)
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your project URL and anon key from Settings → API
3. Run `schema.sql` in the SQL editor

### Stripe (Billing)
1. Go to [stripe.com](https://stripe.com) → Get API keys
2. Create two products: Pro ($29/mo) and Enterprise ($79/mo)
3. Copy the price IDs to `.env.local`

### EnsembleData (TikTok Scraping)
1. Go to [ensembledata.com](https://ensembledata.com) → Sign up
2. Copy your API key to `.env.local`

### Anthropic (AI)
1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys
2. Copy key to `.env.local`

### Upstash Redis (Caching)
1. Go to [console.upstash.com](https://console.upstash.com) → Create database
2. Copy REST URL and token to `.env.local`

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/               # Login / Register pages
│   ├── dashboard/          # All dashboard pages
│   │   ├── overview/       # Main metrics dashboard
│   │   ├── competitors/    # Competitor tracking
│   │   ├── hooks/          # Hook analyzer
│   │   └── content-planner/# Script planning
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Reusable UI primitives
│   ├── dashboard/          # Dashboard-specific components
│   ├── charts/             # Chart components
│   └── layout/             # Sidebar, TopBar
├── lib/
│   ├── supabase/           # DB client + schema
│   ├── stripe/             # Billing helpers
│   ├── tiktok/             # TikTok API client
│   ├── ai/                 # Claude AI integration
│   └── utils/              # Shared utilities
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types
└── styles/                 # Global CSS

tests/
├── unit/
│   ├── components/         # Component tests
│   ├── lib/                # Utility function tests
│   └── hooks/              # Custom hook tests
└── integration/
    ├── api/                # API route tests
    └── db/                 # Database query tests
```

---

## Pushing to GitHub

After cloning and installing:

```bash
git add .
git commit -m "feat: initial project scaffold"
git push origin main
```

---

## Pricing Tiers

| Feature | Free | Pro ($29/mo) | Enterprise ($79/mo) |
|---|---|---|---|
| Data history | 7 days | 90 days | Unlimited |
| Competitor tracking | — | Up to 5 | Unlimited |
| Hook analysis | 5/mo | Unlimited | Unlimited |
| AI script suggestions | — | ✅ | ✅ |
| Multi-account | — | — | ✅ |
| API access | — | — | ✅ |
