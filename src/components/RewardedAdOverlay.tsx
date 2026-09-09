"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { loadAdsScript, pushAd } from "@/lib/adsense";

// Rewarded ad gate shown before a download when AdSense rewarded ads are
// configured. Google's web rewarded API signals a reward via callbacks on
// the `adsbygoogle` queue:
//   - onRewardedAdStartedView: the ad began playing
//   - onRewardedAdGratitude: the user earned the reward (ad completed)
// There is no server-side verification for web rewarded ads, so the reward
// callback is what triggers the parent to spend its signed grant. A watchdog
// avoids dead ends (no fill, un-approved account): if nothing fires, the
// visitor gets a "download directly" fallback instead of a broken button.

type RewardedAdGlobal = {
  adsbygoogle?: unknown[] & {
    onRewardedAdStartedView?: () => void;
    onRewardedAdGratitude?: () => void;
  };
};

const NO_FILL_TIMEOUT_MS = 25_000;

export default function RewardedAdOverlay({
  adClient,
  adSlot,
  rewardLabel,
  onRewarded,
  onCancel,
  onFallbackDownload,
}: {
  adClient: string;
  adSlot: string;
  rewardLabel: string;
  onRewarded: () => void;
  onCancel: () => void;
  onFallbackDownload: () => void;
}) {
  const [status, setStatus] = useState<"requesting" | "playing" | "unavailable">("requesting");
  const rewardedRef = useRef(false);

  useEffect(() => {
    loadAdsScript(adClient);
    const g = window as unknown as RewardedAdGlobal;
    const queue = (g.adsbygoogle = g.adsbygoogle || []);
    const prevStarted = queue.onRewardedAdStartedView;
    const prevGratitude = queue.onRewardedAdGratitude;

    queue.onRewardedAdStartedView = () => setStatus("playing");
    queue.onRewardedAdGratitude = () => {
      if (rewardedRef.current) return;
      rewardedRef.current = true;
      setStatus("playing");
      onRewarded();
    };

    const t = setTimeout(pushAd, 250);
    const watchdog = setTimeout(() => {
      if (!rewardedRef.current) setStatus("unavailable");
    }, NO_FILL_TIMEOUT_MS);

    return () => {
      clearTimeout(t);
      clearTimeout(watchdog);
      if (g.adsbygoogle) {
        if (prevStarted) g.adsbygoogle.onRewardedAdStartedView = prevStarted;
        else delete g.adsbygoogle.onRewardedAdStartedView;
        if (prevGratitude) g.adsbygoogle.onRewardedAdGratitude = prevGratitude;
        else delete g.adsbygoogle.onRewardedAdGratitude;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Watch an ad to unlock the ${rewardLabel}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 px-6"
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="w-full max-w-md border border-border bg-surface p-6 shadow-2xl">
        <header className="mb-4">
          <h2 className="font-display text-xl">Unlock your {rewardLabel}</h2>
          <p className="text-sm text-muted mt-1">
            Watch one short ad and the {rewardLabel} starts downloading right
            after. Free — no payment required.
          </p>
        </header>

        {status === "unavailable" ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted mb-4">
              No ad is available right now. You can download directly instead.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={onFallbackDownload}>
                Download directly
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex min-h-[180px] w-full items-start justify-center border border-dashed border-border bg-ink p-4">
              <ins
                className="adsbygoogle"
                style={{ display: "inline-block" }}
                data-ad-client={adClient}
                data-ad-slot={adSlot}
                data-ad-format="rewarded"
              />
            </div>
            <p
              className="text-sm text-muted mt-3"
              aria-live="polite"
            >
              {status === "playing"
                ? "Almost done — finish the ad to earn your download."
                : "Finding an ad…"}
            </p>
          </>
        )}

        <footer className="flex justify-between items-center mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer text-xs text-muted underline-offset-2 hover:text-text hover:underline"
          >
            No thanks, I&apos;ll skip
          </button>
        </footer>
      </div>
    </div>
  );
}