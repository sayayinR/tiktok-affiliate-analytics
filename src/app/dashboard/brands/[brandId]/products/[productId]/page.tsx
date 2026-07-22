import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, Video, Eye, TrendingUp, Calendar } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/client";
import { formatCount, formatDate } from "@/lib/utils";
import { TaggedVideosSection, type Video as TaggedVideo } from "./TaggedVideosSection";

interface Product {
  id: string;
  name: string;
  color: string;
}

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

  const videoList = (videosData || []) as TaggedVideo[];
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
      <TaggedVideosSection productId={product.id} videos={videoList} />
    </div>
  );
}
