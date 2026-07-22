"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

const MAX_OUTER_LOOPS = 50;
const OUTER_LOOP_PAUSE_MS = 500;

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setMessage("");

    let totalSynced = 0;

    try {
      for (let i = 0; i < MAX_OUTER_LOOPS; i++) {
        const res = await fetch("/api/tiktok/sync", { method: "POST" });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setMessage(`❌ ${data.error || "Sync failed"}`);
          return;
        }

        totalSynced += data.count || 0;

        if (data.complete) {
          setMessage(`✅ Synced ${totalSynced} videos — up to date`);
          return;
        }

        setMessage(`⏳ Synced ${totalSynced} videos so far...`);

        // Brief pause between outer client-driven calls — the server
        // already paces its own inter-page requests by 500ms, this is
        // just a safety margin against hammering the endpoint back-to-back.
        await new Promise((resolve) => setTimeout(resolve, OUTER_LOOP_PAUSE_MS));
      }

      setMessage(
        `⚠️ Synced ${totalSynced} videos but stopped after ${MAX_OUTER_LOOPS} rounds — try again to continue`
      );
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
