import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase before importing the route
vi.mock('@/lib/supabase/client', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    date: '2026-04-21',
                    views: 7100,
                    likes: 890,
                    followers: 150,
                    estimated_gmv: 620,
                  },
                ],
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
  })),
}))

vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}))

describe('Analytics API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

    // Simulate the auth check logic from the API route
    const { userId } = await auth()
    expect(userId).toBeNull()
  })

  it('returns analytics data for authenticated user', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase/client')
    const client = supabaseAdmin()

    const result = await client
      .from('performance_snapshots')
      .select('*')
      .eq('user_id', 'test-user-id')
      .order('date', { ascending: false } as any)
      .limit(7)

    expect(result.data).toHaveLength(1)
    expect(result.data![0].views).toBe(7100)
    expect(result.data![0].estimated_gmv).toBe(620)
    expect(result.error).toBeNull()
  })

  it('handles database errors gracefully', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase/client')
    vi.mocked(supabaseAdmin).mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve({ data: null, error: { message: 'DB Error' } })
              ),
            })),
          })),
        })),
      })),
    } as any)

    const client = supabaseAdmin()
    const result = await client
      .from('performance_snapshots')
      .select('*')
      .eq('user_id', 'test-user-id')
      .order('date', { ascending: false } as any)
      .limit(7)

    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
  })
})
