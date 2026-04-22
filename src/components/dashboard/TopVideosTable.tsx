import { formatCount, truncate } from '@/lib/utils'
import { TikTokVideo, HookType } from '@/types'

const MOCK_VIDEOS: Partial<TikTokVideo>[] = [
  {
    id: '1',
    description: 'After 30 our testosterone drops 1% every year. Most men over 40...',
    viewCount: 3057,
    likeCount: 412,
    hookType: 'fear',
    hookScore: 9,
  },
  {
    id: '2',
    description: 'Poor blood circulation and low nitric oxide after 40 affects morn...',
    viewCount: 2244,
    likeCount: 318,
    hookType: 'ego',
    hookScore: 8,
  },
  {
    id: '3',
    description: 'Most men over 40 don\'t realize how much their hormone levels h...',
    viewCount: 995,
    likeCount: 134,
    hookType: 'curiosity',
    hookScore: 7,
  },
  {
    id: '4',
    description: 'If you are over the age of 40 or 50 you need to pay attention to...',
    viewCount: 878,
    likeCount: 98,
    hookType: 'fear',
    hookScore: 6,
  },
]

const HOOK_TYPE_COLORS: Record<HookType, string> = {
  fear: 'text-red-400 bg-red-400/10',
  ego: 'text-orange-400 bg-orange-400/10',
  curiosity: 'text-blue-400 bg-blue-400/10',
  social_proof: 'text-green-400 bg-green-400/10',
  controversy: 'text-purple-400 bg-purple-400/10',
  demo: 'text-yellow-400 bg-yellow-400/10',
  unknown: 'text-muted-foreground bg-muted',
}

export function TopVideosTable() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Top Posts</h3>
          <p className="text-xs text-muted-foreground">Last 7 days · by views</p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {MOCK_VIDEOS.map((video, idx) => (
          <div
            key={video.id}
            className="flex items-center gap-4 px-5 py-3 hover:bg-accent/50 transition-colors"
          >
            {/* Rank */}
            <span className="w-5 text-sm font-mono text-muted-foreground flex-shrink-0">
              {idx + 1}
            </span>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                {truncate(video.description || '', 60)}
              </p>
            </div>

            {/* Hook type badge */}
            {video.hookType && (
              <span
                className={`hidden sm:inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize flex-shrink-0 ${
                  HOOK_TYPE_COLORS[video.hookType]
                }`}
              >
                {video.hookType.replace('_', ' ')}
              </span>
            )}

            {/* Hook score */}
            {video.hookScore !== undefined && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground">Score</span>
                <span className="text-xs font-bold text-brand">{video.hookScore}/10</span>
              </div>
            )}

            {/* Views */}
            <span className="text-sm font-medium text-foreground w-16 text-right flex-shrink-0">
              {formatCount(video.viewCount || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
