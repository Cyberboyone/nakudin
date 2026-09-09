"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { getServerSnapshot, hasConsented, subscribe } from "@/lib/consent";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ADSENSE_SIDE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SIDE_SLOT;
// Real ads only render once a publisher ID AND an ad-unit slot are
// configured (Vercel env vars) and the visitor has accepted the cookie
// consent. Until then, this reserves the space with a labeled placeholder.
const ADS_READY = Boolean(ADSENSE_CLIENT && ADSENSE_SIDE_SLOT);

type AdsGlobal = { adsbygoogle?: unknown[] };

function pushAd() {
  const g = window as unknown as AdsGlobal;
  try {
    (g.adsbygoogle = g.adsbygoogle || []).push({});
  } catch {
    // Ad unit not ready yet — AdSense recovers on its own.
  }
}

function loadAdsScript() {
  if (document.querySelector("script[data-adsbygoogle]")) return;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.dataset.adsbygoogle = "";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  s.onload = () => {
    document.querySelectorAll("ins.adsbygoogle").forEach(() => pushAd());
  };
  document.head.appendChild(s);
}

function AdPanel() {
  if (ADS_READY) {
    return (
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: 160, height: 600 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SIDE_SLOT}
      />
    );
  }

  return (
    <div className="flex h-[600px] w-40 flex-col items-center justify-center gap-2 border border-dashed border-border">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted/50">
        Advertisement
      </span>
      <span className="text-xs text-muted/40">Ad slot</span>
    </div>
  );
}

export default function SideAds() {
  const consented = useSyncExternalStore(subscribe, hasConsented, getServerSnapshot);
  const showAds = ADS_READY && consented;

  useEffect(() => {
    if (!showAds) return;
    loadAdsScript();
    const t = setTimeout(pushAd, 300);
    return () => clearTimeout(t);
  }, [showAds]);

  return (
    <>
      {/* Skyscraper columns for the desktop side margins. Only wide enough
          screens (≥1536px) actually have room beside the max-w-5xl content,
          so anything narrower stays clean. */}
      <div
        className="fixed top-1/2 left-6 z-40 hidden -translate-y-1/2 2xl:block"
        aria-label="Advertisement"
      >
        <AdPanel />
      </div>
      <div
        className="fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 2xl:block"
        aria-label="Advertisement"
      >
        <AdPanel />
      </div>
    </>
  );
}