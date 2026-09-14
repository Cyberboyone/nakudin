"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { getServerSnapshot, hasConsented, subscribe } from "@/lib/consent";
import { loadAdsScript, pushAd } from "@/lib/adsense";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ADSENSE_INFEED_SLOT = process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT;
const ADS_READY = Boolean(ADSENSE_CLIENT && ADSENSE_INFEED_SLOT);

export default function InFeedAd() {
  const consented = useSyncExternalStore(
    subscribe,
    hasConsented,
    getServerSnapshot
  );
  const showAds = ADS_READY && consented;

  useEffect(() => {
    if (!showAds || !ADSENSE_CLIENT) return;
    loadAdsScript(ADSENSE_CLIENT);
    const t = setTimeout(pushAd, 300);
    return () => clearTimeout(t);
  }, [showAds]);

  return (
    <li className="py-4 flex justify-center" aria-label="Advertisement">
      <div className="w-full max-w-[728px] flex flex-col items-center">
        {showAds ? (
          <ins
            className="adsbygoogle"
            style={{ display: "inline-block", width: "100%", height: "90px" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_INFEED_SLOT}
          />
        ) : (
          <div className="w-full h-[90px] border border-dashed border-border flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted/50">
              Advertisement
            </span>
            <span className="text-xs text-muted/40">Ad slot</span>
          </div>
        )}
      </div>
    </li>
  );
}