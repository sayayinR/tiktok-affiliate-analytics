'use client'

import { UserButton } from '@clerk/nextjs'
import { Bell } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          TikTok Shop Affiliate Intelligence Platform
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  )
}
