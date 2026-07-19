import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, ShoppingBag, Package, Video, Eye } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/client";
import { formatCount } from "@/lib/utils";
import { ProductsSection, type Product } from "./ProductsSection";

interface Brand {
  id: string;
  name: string;
  color: string;
}

export default async function BrandDetailPage({
  params,
}: {
  params: { brandId: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/auth/login");

  const { data: user } = await supabaseAdmin()
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (!user) redirect("/auth/login");

  const { data: brandData } = await supabaseAdmin()
    .from("brands")
    .select("*")
    .eq("id", params.brandId)
    .eq("user_id", user.id)
    .single();

  const brand = brandData as Brand | null;

  if (!brand) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Brands
        </Link>

        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Brand not found
          </h3>
          <p className="text-xs text-muted-foreground">
            This brand doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
      </div>
    );
  }

  const { data: productsData } = await supabaseAdmin()
    .from("products")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const products = (productsData || []) as Product[];
  const productIds = products.map((p) => p.id);

  const { data: videosData } = productIds.length
    ? await supabaseAdmin()
        .from("tiktok_videos")
        .select("product_id, view_count")
        .eq("user_id", user.id)
        .in("product_id", productIds)
    : { data: [] as { product_id: string; view_count: number }[] };

  const statsByProduct = new Map<string, { videoCount: number; totalViews: number }>();
  for (const v of videosData || []) {
    if (!v.product_id) continue;
    const entry = statsByProduct.get(v.product_id) || { videoCount: 0, totalViews: 0 };
    entry.videoCount += 1;
    entry.totalViews += v.view_count || 0;
    statsByProduct.set(v.product_id, entry);
  }

  const productsWithStats = products.map((p) => {
    const s = statsByProduct.get(p.id) || { videoCount: 0, totalViews: 0 };
    return {
      ...p,
      video_count: s.videoCount,
      total_views: s.totalViews,
      avg_views: s.videoCount > 0 ? Math.round(s.totalViews / s.videoCount) : 0,
    };
  });

  const totalProducts = products.length;
  const totalVideos = productsWithStats.reduce((sum, p) => sum + p.video_count, 0);
  const totalViews = productsWithStats.reduce((sum, p) => sum + p.total_views, 0);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/brands"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Brands
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: brand.color }}
        />
        <h1 className="text-2xl font-bold text-foreground">{brand.name}</h1>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Products
            </span>
            <Package className="h-4 w-4 text-brand" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Videos
            </span>
            <Video className="h-4 w-4 text-brand" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalVideos}</p>
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
      </div>

      {/* Products */}
      <ProductsSection brandId={brand.id} products={productsWithStats} />
    </div>
  );
}
