import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, Video, Eye, TrendingUp, Calendar } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/client";
import { formatCount, formatDate, truncate } from "@/lib/utils";
import { HookType } from "@/types";

interface Product {
  id: string;
  name: string;
  keywords: string[];
  color: string;
}

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

export default async function ProductDetailPage({
  params,
}: {
  params: { brandId: string; productId: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/auth/login");

  const { data: user } = await supabaseAdmin()
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (!user) redirect("/auth/login");

  const { data: brand } = await supabaseAdmin()
    .from("brands")
    .select("name, color")
    .eq("id", params.brandId)
    .eq("user_id", user.id)
    .single();

  const { data: productData } = await supabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", params.productId)
    .eq("user_id", user.id)
    .eq("brand_id", params.brandId)
    .single();

  const product = productData as Product | null;

  if (!product) {
    return (
      <div className="space-y-6">
        <Link
          href={`/dashboard/brands/${params.brandId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Brand
        </Link>

        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Product not found
          </h3>
          <p className="text-xs text-muted-foreground">
            This product doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
      </div>
    );
  }

  const { data: videosData } = await supabaseAdmin()
    .from("tiktok_videos")
    .select("*")
    .eq("product_id", product.id)
    .eq("user_id", user.id)
    .order("view_count", { ascending: false });

  const videoList = (videosData || []) as Video[];
  const videoCount = videoList.length;
  const totalViews = videoList.reduce((sum, v) => sum + (v.view_count || 0), 0);
  const avgViews = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
  const lastPostedRaw = [...videoList].sort(
    (a, b) => b.create_time - a.create_time
  )[0]?.create_time;
  const lastPosted = lastPostedRaw
    ? new Date(lastPostedRaw * 1000).toISOString()
    : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/brands/${params.brandId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Brand
      </Link>

      {/* Header */}
      <div>
        {brand && (
          <p className="text-xs text-muted-foreground mb-1">
            {brand.name} / {product.name}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: product.color }}
          />
          <h1 className="text-2xl font-bold text-foreground">
            {product.name}
          </h1>
        </div>
        {product.keywords && product.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.keywords.map((kw) => (
              <span
                key={kw}
                className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Videos
            </span>
            <Video className="h-4 w-4 text-brand" />
          </div>
          <p className="text-2xl font-bold text-foreground">{videoCount}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Views
            </span>
            <Eye className="h-4 w-4 text-brand" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCount(totalViews)}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Avg Views
            </span>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCount(avgViews)}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last Posted
            </span>
            <Calendar className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {lastPosted ? formatDate(lastPosted) : "—"}
          </p>
        </div>
      </div>

      {/* Tagged videos */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Tagged Videos
            </h3>
            <p className="text-xs text-muted-foreground">Sorted by views</p>
          </div>
        </div>

        {videoCount === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No videos tagged to this product yet — videos matching its
            keywords will appear here automatically.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {videoList.map((video, idx) => (
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

                {/* Comments */}
                <span className="hidden md:inline text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                  💬 {formatCount(video.comment_count || 0)}
                </span>

                {/* Shares */}
                <span className="hidden md:inline text-xs text-muted-foreground w-12 text-right flex-shrink-0">
                  ↗ {formatCount(video.share_count || 0)}
                </span>

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
    </div>
  );
}
