'use client'

import Link from 'next/link'
import { Zap, Users, Calendar, RefreshCw } from 'lucide-react'

const ACTIONS = [
  {
    label: 'Analyze Hook',
    description: 'Score your latest hooks',
    href: '/dashboard/hooks',
    icon: Zap,
    color: 'text-brand',
    bg: 'bg-brand/10 hover:bg-brand/20',
  },
  {
    label: 'Track Competitor',
    description: 'Add a creator to watch',
    href: '/dashboard/competitors',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 hover:bg-purple-400/20',
  },
  {
    label: 'Plan Content',
    description: 'Fill your script queue',
    href: '/dashboard/content-planner',
    icon: Calendar,
    color: 'text-green-400',
    bg: 'bg-green-400/10 hover:bg-green-400/20',
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-colors ${action.bg}`}
          >
            <div className={`rounded-md p-2 ${action.bg}`}>
              <Icon className={`h-4 w-4 ${action.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground truncate">{action.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
