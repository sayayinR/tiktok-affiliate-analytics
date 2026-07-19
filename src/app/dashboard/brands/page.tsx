"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingBag, Package } from "lucide-react";
import { formatCount } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  color: string;
  video_count?: number;
  total_views?: number;
  product_count?: number;
}

const COLORS = [
  "#00d4ff",
  "#ff6b35",
  "#00ff94",
  "#ffd166",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fb923c",
];

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    color: COLORS[0],
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      setBrands(data.brands || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color,
        }),
      });

      if (res.ok) {
        setForm({ name: "", color: COLORS[0] });
        setShowForm(false);
        fetchBrands();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Brands & Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track performance by product across all your videos
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-md bg-brand text-background px-4 py-2 text-sm font-bold hover:bg-brand-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Brand
        </button>
      </div>

      {/* Add Brand Form */}
      {showForm && (
        <div className="rounded-lg border border-brand/30 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            New Brand
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Brand Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Snap Supplements"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Color
              </label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      form.color === c
                        ? "border-white scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 py-2 rounded-md bg-brand text-background text-sm font-bold disabled:opacity-30 hover:bg-brand-dark transition-colors"
            >
              {saving ? "Saving..." : "Save Brand"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-md border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Brands Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-lg bg-secondary animate-pulse"
            />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-2">
            No brands yet
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Add your first brand to start tracking performance across your
            products and videos.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-brand hover:underline"
          >
            + Add your first brand
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <a
              key={brand.id}
              href={`/dashboard/brands/${brand.id}`}
              className="rounded-lg border border-border bg-card p-5 hover:border-brand/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: brand.color }}
                />
                <h3 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                  {brand.name}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Videos</p>
                  <p className="text-lg font-bold text-foreground">
                    {brand.video_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Views
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCount(brand.total_views || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Products
                  </p>
                  <p className="text-lg font-bold text-foreground flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    {brand.product_count || 0}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
