"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import RewardedAdOverlay from "@/components/RewardedAdOverlay";
import { getServerSnapshot, hasConsented, subscribe } from "@/lib/consent";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ADSENSE_REWARDED_SLOT = process.env.NEXT_PUBLIC_ADSENSE_REWARDED_SLOT;

type Props = {
  projectId: string;
  fileType: "materials" | "word" | "source";
  label: string;
};

const REWARD_LABELS: Record<Props["fileType"], string> = {
  materials: "PDF download",
  word: "Word download",
  source: "source code",
};

function FileTypeIcon({ fileType }: { fileType: Props["fileType"] }) {
  if (fileType === "materials") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="3" fill="#E5484D" />
        <text
          x="12"
          y="15.5"
          textAnchor="middle"
          fontSize="6.4"
          fontWeight="700"
          fill="#ffffff"
          fontFamily="IBM Plex Sans, sans-serif"
        >
          PDF
        </text>
      </svg>
    );
  }
  if (fileType === "word") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="3" fill="#2F6FED" />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#ffffff"
          fontFamily="IBM Plex Sans, sans-serif"
        >
          W
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#E8A33D" />
      <path
        d="m8.5 8-4 4 4 4"
        stroke="#12151C"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m15.5 8 4 4-4 4"
        stroke="#12151C"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DownloadButton({ projectId, fileType, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const grantRef = useRef<string | null>(null);
  const consented = useSyncExternalStore(subscribe, hasConsented, getServerSnapshot);

  // Rewarded ads gate downloads only when configured AND the visitor has
  // accepted cookie consent. Otherwise the button behaves exactly as before.
  const rewardedEnabled = Boolean(ADSENSE_CLIENT && ADSENSE_REWARDED_SLOT && consented);

  async function doDownload(grant: string | null) {
    setLoading(true);
    setError(null);
    try {
      const grantParam = grant ? `&grant=${encodeURIComponent(grant)}` : "";
      const res = await fetch(`/api/download/${projectId}?type=${fileType}${grantParam}`);
      if (!res.ok) throw new Error("Could not get download link");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Couldn't prepare that download.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClick() {
    setError(null);
    if (!rewardedEnabled) {
      await doDownload(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reward/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, fileType }),
      });
      if (res.status === 429) {
        const data = await res.json();
        const minutes = data.retryAfterSeconds ? Math.ceil(data.retryAfterSeconds / 60) : null;
        setError(
          minutes
            ? `You've reached the free download limit. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
            : "Too many downloads right now. Please try again later."
        );
        return;
      }
      if (!res.ok) {
        setError("That file isn't available for a rewarded download right now.");
        return;
      }
      const { token } = await res.json();
      grantRef.current = token;
      setShowAd(true);
    } catch {
      setError("Couldn't start the rewarded download. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Button onClick={handleClick} disabled={loading}>
          <span className="inline-flex items-center gap-2">
            <FileTypeIcon fileType={fileType} />
            <span>{loading ? "Preparing download…" : label}</span>
          </span>
        </Button>
        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}{" "}
            <button onClick={handleClick} className="underline hover:text-red-300">
              Try again
            </button>
          </p>
        )}
      </div>

      {showAd && ADSENSE_CLIENT && ADSENSE_REWARDED_SLOT && (
        <RewardedAdOverlay
          adClient={ADSENSE_CLIENT}
          adSlot={ADSENSE_REWARDED_SLOT}
          rewardLabel={REWARD_LABELS[fileType]}
          onRewarded={() => {
            setShowAd(false);
            doDownload(grantRef.current);
          }}
          onFallbackDownload={() => {
            setShowAd(false);
            doDownload(grantRef.current);
          }}
          onCancel={() => setShowAd(false)}
        />
      )}
    </>
  );
}