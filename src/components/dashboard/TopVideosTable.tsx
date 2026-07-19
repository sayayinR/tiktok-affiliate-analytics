"use client";

import { useEffect, useState } from "react";
import { formatCount, truncate } from "@/lib/utils";
import { HookType } from "@/types";

interface Video {
  id: string;
  tiktok_video_id: string;
  description: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  hook_type: HookType | null;
  hook_score: number | null;
  create_time: number;
}

const HOOK_TYPE_COLORS: Record<string, string> = {
  fear: "text-red-400 bg-red-400/10",
  ego: "text-orange-400 bg-orange-400/10",
  curiosity: "text-blue-400 bg-blue-400/10",
  social_proof: "text-green-400 bg-green-400/10",
  controversy: "text-purple-400 bg-purple-400/10",
  demo: "text-yellow-400 bg-yellow-400/10",
  unknown: "text-muted-foreground bg-muted",
};

export function TopVideosTable() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tiktok/videos")
      .then((res) => res.json())
      .then((data) => {
        setVideos(data.videos || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Top Videos</h3>
          <p className="text-xs text-muted-foreground">Sorted by views</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading videos...
        </div>
      ) : videos.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No videos yet — click "Sync TikTok" to pull your videos.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {videos.map((video, idx) => (
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
                  {truncate(video.description || "No description", 60)}
                </p>
              </div>

              {/* Hook type badge */}
              {video.hook_type && (
                <span
                  className={`hidden sm:inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize flex-shrink-0 ${
                    HOOK_TYPE_COLORS[video.hook_type] ||
                    HOOK_TYPE_COLORS.unknown
                  }`}
                >
                  {video.hook_type.replace("_", " ")}
                </span>
              )}

              {/* Hook score */}
              {video.hook_score !== null && video.hook_score !== undefined && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <span className="text-xs font-bold text-brand">
                    {video.hook_score}/10
                  </span>
                </div>
              )}

              {/* Likes */}
              <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                ♥ {formatCount(video.like_count || 0)}
              </span>

              {/* Views */}
              <span className="text-sm font-medium text-foreground w-16 text-right flex-shrink-0">
                {formatCount(video.view_count || 0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
