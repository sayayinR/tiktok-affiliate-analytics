"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, Hash } from "lucide-react";
import { formatCount } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  color: string;
  video_count?: number;
  total_views?: number;
  avg_views?: number;
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

export function ProductsSection({
  brandId,
  products,
}: {
  brandId: string;
  products: Product[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    color: COLORS[0],
  });
  const [suggestions, setSuggestions] = useState<
    { phrase: string; count: number; source: "hashtag" | "phrase" }[]
  >([]);
  const [nameFocused, setNameFocused] = useState(false);

  useEffect(() => {
    if (!showForm) {
      setNameFocused(false);
      return;
    }
    let cancelled = false;
    fetch("/api/products/suggestions")
      .then((res) => (res.ok ? res.json() : { suggestions: [] }))
      .then((data) => {
        if (!cancelled) setSuggestions(data.suggestions || []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showForm]);

  const filteredSuggestions = form.name.trim()
    ? suggestions
        .filter((s) =>
          s.phrase.toLowerCase().includes(form.name.trim().toLowerCase())
        )
        .slice(0, 6)
    : [];

  const showSuggestionDropdown =
    nameFocused && form.name.trim().length > 0 && filteredSuggestions.length > 0;

  const handleSelectSuggestion = (s: { phrase: string }) => {
    setForm((f) => ({ ...f, name: s.phrase }));
    setNameFocused(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color,
          brandId,
        }),
      });

      if (res.ok) {
        setForm({ name: "", color: COLORS[0] });
        setShowForm(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Products</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-md bg-brand text-background px-4 py-2 text-sm font-bold hover:bg-brand-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-brand/30 bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            New Product / SKU
          </h3>

          <div className="space-y-3">
            <div className="relative">
              <label className="text-xs text-muted-foreground mb-1 block">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Snap Chews"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setNameFocused(false);
                }}
                autoComplete="off"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand"
              />

              {showSuggestionDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s.phrase}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(s);
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {s.source === "hashtag" && (
                          <Hash className="h-3 w-3 text-brand flex-shrink-0" />
                        )}
                        <span className="truncate">{s.phrase}</span>
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {s.count} video{s.count === 1 ? "" : "s"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
              {saving ? "Saving..." : "Save Product"}
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

      {products.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-2">
            No products yet
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Add your first product or SKU to start tagging videos to it.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-brand hover:underline"
          >
            + Add your first product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <a
              key={product.id}
              href={`/dashboard/brands/${brandId}/products/${product.id}`}
              className="rounded-lg border border-border bg-card p-5 hover:border-brand/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: product.color }}
                />
                <h3 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                  {product.name}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Videos</p>
                  <p className="text-lg font-bold text-foreground">
                    {product.video_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Views
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCount(product.total_views || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Avg Views
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCount(product.avg_views || 0)}
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
