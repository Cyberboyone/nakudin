// Shared helpers for driving the `adsbygoogle` tag. Both the side-column ads
// and the rewarded download gate load the same script exactly once and push
// ad units through the same queue.

type AdsGlobal = { adsbygoogle?: unknown[] };

export function pushAd() {
  const g = window as unknown as AdsGlobal;
  try {
    (g.adsbygoogle = g.adsbygoogle || []).push({});
  } catch {
    // Ad unit not ready yet — AdSense recovers on its own.
  }
}

export function loadAdsScript(clientId: string) {
  if (document.querySelector("script[data-adsbygoogle]")) return;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.dataset.adsbygoogle = "";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  s.onload = () => {
    document.querySelectorAll("ins.adsbygoogle").forEach(() => pushAd());
  };
  document.head.appendChild(s);
}