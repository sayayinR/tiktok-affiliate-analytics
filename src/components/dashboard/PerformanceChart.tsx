'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCount, formatCurrency, formatDate } from '@/lib/utils'

// Mock data — will be replaced with real Supabase data
const MOCK_DATA = [
  { date: '2026-04-15', views: 4200, gmv: 340 },
  { date: '2026-04-16', views: 3800, gmv: 290 },
  { date: '2026-04-17', views: 5100, gmv: 420 },
  { date: '2026-04-18', views: 4700, gmv: 380 },
  { date: '2026-04-19', views: 6200, gmv: 510 },
  { date: '2026-04-20', views: 5800, gmv: 470 },
  { date: '2026-04-21', views: 7100, gmv: 620 },
]

interface PerformanceChartProps {
  metric: 'views' | 'gmv'
}

export function PerformanceChart({ metric }: PerformanceChartProps) {
  const isViews = metric === 'views'
  const color = isViews ? '#00d4ff' : '#ffd166'
  const label = isViews ? 'Views' : 'Est. GMV'

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="text-xs text-muted-foreground">Last 7 days</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={MOCK_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => isViews ? formatCount(v) : formatCurrency(v)}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelFormatter={formatDate}
            formatter={(value: number) => [
              isViews ? formatCount(value) : formatCurrency(value),
              label,
            ]}
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${metric})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
