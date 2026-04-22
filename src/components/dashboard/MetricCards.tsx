import { Eye, Heart, TrendingUp, DollarSign } from 'lucide-react'
import { formatCount, formatCurrency, formatPercent } from '@/lib/utils'

// In a real app these come from your API / Supabase
// For now we use placeholder data so the UI renders
const MOCK_METRICS = [
  {
    label: 'Total Views',
    value: 12450,
    delta: 18.4,
    icon: Eye,
    color: 'text-brand',
    format: 'count',
  },
  {
    label: 'Total Likes',
    value: 3210,
    delta: 12.1,
    icon: Heart,
    color: 'text-pink-400',
    format: 'count',
  },
  {
    label: 'Follower Growth',
    value: 342,
    delta: 5.7,
    icon: TrendingUp,
    color: 'text-green-400',
    format: 'count',
  },
  {
    label: 'Est. GMV',
    value: 1840,
    delta: 24.3,
    icon: DollarSign,
    color: 'text-yellow-400',
    format: 'currency',
  },
]

export function MetricCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {MOCK_METRICS.map((metric) => {
        const Icon = metric.icon
        const isPositive = metric.delta >= 0

        return (
          <div
            key={metric.label}
            className="rounded-lg border border-border bg-card p-4 card-glow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {metric.label}
              </span>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {metric.format === 'currency'
                  ? formatCurrency(metric.value)
                  : formatCount(metric.value)}
              </p>
              <p
                className={`text-xs font-medium ${
                  isPositive ? 'text-green-400' : 'text-destructive'
                }`}
              >
                {formatPercent(metric.delta)} vs last week
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
