"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/tiktok/sync", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ ${data.error || "Sync failed"}`);
      }
    } catch (err) {
      setMessage("❌ Sync failed");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 rounded-md bg-brand/10 border border-brand/30 px-3 py-2 text-xs font-medium text-brand hover:bg-brand/20 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing..." : "Sync TikTok"}
      </button>
    </div>
  );
}
