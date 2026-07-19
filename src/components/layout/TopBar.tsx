"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface TopBarProps {
  tiktokConnected?: boolean;
  tiktokUsername?: string | null;
}

export function TopBar({ tiktokConnected, tiktokUsername }: TopBarProps) {
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (searchParams.get("error")) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  }, [searchParams]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          TikTok Shop Affiliate Intelligence Platform
        </span>
      </div>

      {showSuccess && (
        <div className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-md">
          ✅ TikTok connected successfully!
        </div>
      )}
      {showError && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-1 rounded-md">
          ❌ TikTok connection failed. Try again.
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Show TikTok status */}
        {tiktokConnected ? (
          <div className="flex items-center gap-2 rounded-md bg-green-400/10 border border-green-400/20 px-3 py-1.5 text-xs font-medium text-green-400">
            <span>🎵</span>
            {tiktokUsername || "TikTok Connected"}
          </div>
        ) : (
          <a
            href="/api/auth/tiktok"
            className="flex items-center gap-2 rounded-md bg-brand/10 border border-brand/30 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/20 transition-colors"
          >
            <span>🎵</span>
            Connect TikTok
          </a>
        )}

        <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
