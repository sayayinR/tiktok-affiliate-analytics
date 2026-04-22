'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Zap,
  Calendar,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/dashboard/overview',
    icon: LayoutDashboard,
  },
  {
    label: 'Competitors',
    href: '/dashboard/competitors',
    icon: Users,
  },
  {
    label: 'Hook Analyzer',
    href: '/dashboard/hooks',
    icon: Zap,
  },
  {
    label: 'Content Planner',
    href: '/dashboard/content-planner',
    icon: Calendar,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <TrendingUp className="h-5 w-5 text-brand" />
        <span className="font-bold text-sm text-foreground tracking-tight">
          Affiliate<span className="text-brand">IQ</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-brand'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-border p-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
