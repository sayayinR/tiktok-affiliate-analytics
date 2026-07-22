"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tag, Video as VideoIcon, Search, X, ExternalLink } from "lucide-react";
import { formatCount, truncate } from "@/lib/utils";
import { HookType } from "@/types";

export interface Video {
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
  share_url: string | null;
}

interface UntaggedVideo {
  id: string;
  description: string;
  view_count: number;
  cover_image_url: string | null;
  share_url: string | null;
}

function firstWords(text: string, count: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= count) return words.join(" ");
  return words.slice(0, count).join(" ") + "...";
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

export function TaggedVideosSection({
  productId,
  videos,
}: {
  productId: string;
  videos: Video[];
}) {
  const router = useRouter();
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [loadingUntagged, setLoadingUntagged] = useState(false);
  const [untaggedVideos, setUntaggedVideos] = useState<UntaggedVideo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  // TikTok's cover_image_url is a short-lived signed URL that can expire
  // between sync and viewing — fall back to a placeholder instead of a
  // broken image when that happens.
  const [failedThumbnailIds, setFailedThumbnailIds] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [untaggingId, setUntaggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!showTagPanel) return;
    let cancelled = false;
    setLoadingUntagged(true);
    fetch("/api/tiktok/videos/untagged")
      .then((res) => (res.ok ? res.json() : { videos: [] }))
      .then((data) => {
        if (!cancelled) setUntaggedVideos(data.videos || []);
      })
      .catch(() => {
        if (!cancelled) setUntaggedVideos([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUntagged(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showTagPanel]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closePanel = () => {
    setShowTagPanel(false);
    setSelectedIds(new Set());
    setUntaggedVideos([]);
    setSearchQuery("");
  };

  const filteredUntaggedVideos = searchQuery.trim()
    ? untaggedVideos.filter((v) =>
        (v.description || "")
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      )
    : untaggedVideos;

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/tag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        closePanel();
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUntag = async (videoId: string) => {
    setUntaggingId(videoId);
    try {
      const res = await fetch(`/api/products/${productId}/tag`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUntaggingId(null);
    }
  };

  const videoCount = videos.length;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Tagged Videos
          </h3>
          <p className="text-xs text-muted-foreground">Sorted by views</p>
        </div>
        <button
          onClick={() => setShowTagPanel((v) => !v)}
          className="flex items-center gap-2 rounded-md bg-brand text-background px-4 py-2 text-sm font-bold hover:bg-brand-dark transition-colors"
        >
          <Tag className="h-4 w-4" />
          Tag Videos
        </button>
      </div>

      {showTagPanel && (
        <div className="border-b border-border p-5 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Select videos to tag
          </h4>

          {!loadingUntagged && untaggedVideos.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand"
              />
            </div>
          )}

          {loadingUntagged ? (
            <p className="text-xs text-muted-foreground">
              Loading untagged videos...
            </p>
          ) : untaggedVideos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No untagged videos available.
            </p>
          ) : filteredUntaggedVideos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No videos match your search.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {filteredUntaggedVideos.map((v) => (
                <label
                  key={v.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(v.id)}
                    onChange={() => toggleSelected(v.id)}
                    className="h-4 w-4 flex-shrink-0 rounded border-border accent-brand"
                  />
                  {v.cover_image_url && !failedThumbnailIds.has(v.id) ? (
                    <Image
                      src={`/api/tiktok/thumbnail?url=${encodeURIComponent(v.cover_image_url)}`}
                      alt=""
                      width={40}
                      height={56}
                      onError={() =>
                        setFailedThumbnailIds((prev) =>
                          new Set(prev).add(v.id)
                        )
                      }
                      className="rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-10 h-14 rounded bg-secondary flex-shrink-0">
                      <VideoIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {firstWords(v.description || "No description", 10)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {truncate(v.description || "No description", 60)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatCount(v.view_count || 0)} views
                  </span>
                  {v.share_url && (
                    <a
                      href={v.share_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Open on TikTok"
                      className="flex-shrink-0 text-muted-foreground hover:text-brand transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || selectedIds.size === 0}
              className="flex-1 py-2 rounded-md bg-brand text-background text-sm font-bold disabled:opacity-30 hover:bg-brand-dark transition-colors"
            >
              {saving
                ? "Saving..."
                : `Save${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
            </button>
            <button
              onClick={closePanel}
              className="flex-1 py-2 rounded-md border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {videoCount === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No videos tagged to this product yet — use Tag Videos to add some.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {videos.map((video, idx) => (
            <div
              key={video.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-accent/50 transition-colors"
            >
              <span className="w-5 text-sm font-mono text-muted-foreground flex-shrink-0">
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {truncate(video.description || "No description", 60)}
                </p>
              </div>

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

              {video.hook_score !== null && video.hook_score !== undefined && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <span className="text-xs font-bold text-brand">
                    {video.hook_score}/10
                  </span>
                </div>
              )}

              <span className="hidden md:inline text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                💬 {formatCount(video.comment_count || 0)}
              </span>

              <span className="hidden md:inline text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                ↗ {formatCount(video.share_count || 0)}
              </span>

              <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                ♥ {formatCount(video.like_count || 0)}
              </span>

              <span className="text-sm font-medium text-foreground w-16 text-right flex-shrink-0">
                {formatCount(video.view_count || 0)}
              </span>

              {video.share_url && (
                <a
                  href={video.share_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open on TikTok"
                  className="flex-shrink-0 text-muted-foreground hover:text-brand transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              <button
                onClick={() => handleUntag(video.id)}
                disabled={untaggingId === video.id}
                title="Untag"
                className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
