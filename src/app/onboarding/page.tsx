"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NICHES = [
  { value: "health_wellness", label: "Health & Wellness", icon: "💊" },
  { value: "beauty", label: "Beauty", icon: "💄" },
  { value: "fitness", label: "Fitness", icon: "🏋️" },
  { value: "kitchen", label: "Kitchen", icon: "🍳" },
  { value: "pet", label: "Pet", icon: "🐾" },
  { value: "tech", label: "Tech", icon: "📱" },
  { value: "fashion", label: "Fashion", icon: "👗" },
  { value: "home", label: "Home", icon: "🏠" },
  { value: "other", label: "Other", icon: "✨" },
];

const FORMATS = [
  { value: "face_on_camera", label: "Face on Camera", icon: "🎥" },
  { value: "faceless", label: "Faceless / Voiceover", icon: "🎙️" },
  { value: "mixed", label: "Mixed", icon: "🎬" },
];

const GOALS = [
  { value: "views", label: "Grow Views", icon: "👁️" },
  { value: "followers", label: "Grow Followers", icon: "👥" },
  { value: "gmv", label: "Maximize GMV", icon: "💰" },
  { value: "all", label: "All Three", icon: "🚀" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState({
    niches: [] as string[],
    formats: [] as string[],
    goals: [] as string[],
  });

  const toggleNiche = (value: string) => {
    setSelections((s) => ({
      ...s,
      niches: s.niches.includes(value)
        ? s.niches.filter((n) => n !== value)
        : [...s.niches, value],
    }));
  };

  const toggleFormat = (value: string) => {
    setSelections((s) => ({
      ...s,
      formats: s.formats.includes(value)
        ? s.formats.filter((f) => f !== value)
        : [...s.formats, value],
    }));
  };

  const toggleGoal = (value: string) => {
    setSelections((s) => ({
      ...s,
      goals: s.goals.includes(value)
        ? s.goals.filter((g) => g !== value)
        : [...s.goals, value],
    }));
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSaveAndConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niches: selections.niches,
          goals: selections.goals,
          formats: selections.formats,
        }),
      });

      if (res.ok) {
        // Redirect to TikTok OAuth
        window.location.href = "/api/auth/tiktok";
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTikTok = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niches: selections.niches,
          goals: selections.goals,
          formats: selections.formats,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/overview");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-brand font-bold text-lg">AffiliateIQ</span>
          </div>
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-brand" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Step {step} of 4
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 1 && "What niches do you work in?"}
            {step === 2 && "How do you create content?"}
            {step === 3 && "What are your goals?"}
            {step === 4 && "Connect your TikTok account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1 &&
              "Select all that apply — most creators work across multiple niches."}
            {step === 2 &&
              "Select all formats you use — many creators mix it up."}
            {step === 3 &&
              "Select all that apply — we will optimize for everything you pick."}
            {step === 4 &&
              "Connect TikTok to pull your real video data, views, and performance metrics."}
          </p>
        </div>

        {/* Step 1 — Niches */}
        {step === 1 && (
          <div className="grid grid-cols-3 gap-3">
            {NICHES.map((n) => {
              const selected = selections.niches.includes(n.value);
              return (
                <button
                  key={n.value}
                  onClick={() => toggleNiche(n.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                    selected
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-card text-muted-foreground hover:border-brand/50"
                  }`}
                >
                  <span className="text-2xl">{n.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight">
                    {n.label}
                  </span>
                  {selected && (
                    <span className="text-xs text-brand font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2 — Formats */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            {FORMATS.map((f) => {
              const selected = selections.formats.includes(f.value);
              return (
                <button
                  key={f.value}
                  onClick={() => toggleFormat(f.value)}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                    selected
                      ? "border-brand bg-brand/10"
                      : "border-border bg-card hover:border-brand/50"
                  }`}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span
                    className={`font-medium ${
                      selected ? "text-brand" : "text-foreground"
                    }`}
                  >
                    {f.label}
                  </span>
                  {selected && (
                    <span className="ml-auto text-brand font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 3 — Goals */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            {GOALS.map((g) => {
              const selected = selections.goals.includes(g.value);
              return (
                <button
                  key={g.value}
                  onClick={() => toggleGoal(g.value)}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                    selected
                      ? "border-brand bg-brand/10"
                      : "border-border bg-card hover:border-brand/50"
                  }`}
                >
                  <span className="text-2xl">{g.icon}</span>
                  <span
                    className={`font-medium ${
                      selected ? "text-brand" : "text-foreground"
                    }`}
                  >
                    {g.label}
                  </span>
                  {selected && (
                    <span className="ml-auto text-brand font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 4 — Connect TikTok */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <div className="text-5xl mb-4">🎵</div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Connect your TikTok account
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                AffiliateIQ will pull your video performance data including
                views, engagement, and metrics — all in one place.
              </p>
              <button
                onClick={handleSaveAndConnect}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-brand text-background font-bold text-sm disabled:opacity-30 hover:bg-brand-dark transition-colors"
              >
                {loading ? "Saving..." : "🎵 Connect TikTok →"}
              </button>
            </div>

            <button
              onClick={handleSkipTikTok}
              disabled={loading}
              className="w-full py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-sm"
            >
              Skip for now — connect later
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-sm font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && selections.niches.length === 0) ||
                (step === 2 && selections.formats.length === 0) ||
                (step === 3 && selections.goals.length === 0)
              }
              className="flex-1 py-3 rounded-lg bg-brand text-background font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="mt-4">
            <button
              onClick={handleBack}
              className="w-full py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
