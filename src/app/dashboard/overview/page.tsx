import { Suspense } from 'react'
import { MetricCards } from '@/components/dashboard/MetricCards'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { TopVideosTable } from '@/components/dashboard/TopVideosTable'
import { QuickActions } from '@/components/dashboard/QuickActions'

export const metadata = { title: 'Overview' }

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your TikTok Shop performance at a glance
        </p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Metric cards */}
      <Suspense fallback={<MetricCardsSkeleton />}>
        <MetricCards />
      </Suspense>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <PerformanceChart metric="views" />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <PerformanceChart metric="gmv" />
        </Suspense>
      </div>

      {/* Top videos */}
      <Suspense fallback={<TableSkeleton />}>
        <TopVideosTable />
      </Suspense>
    </div>
  )
}

// Loading skeletons
function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-lg bg-secondary animate-pulse" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-72 rounded-lg bg-secondary animate-pulse" />
}

function TableSkeleton() {
  return <div className="h-64 rounded-lg bg-secondary animate-pulse" />
}
