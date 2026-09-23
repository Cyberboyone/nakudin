"use client";

import { useEffect, useState } from "react";

/**
 * PDF preview that works on Android Chrome.
 *
 * Desktop / fine-pointer: keep the inline iframe (same-origin proxy at
 * /api/preview/:slug renders PDFs well in Chrome desktop, Safari, Firefox).
 *
 * Mobile / coarse-pointer: Android Chrome CANNOT render a PDF inside an iframe —
 * it shows a placeholder ("Open") card instead because its built-in PDF viewer
 * refuses to work in nested browsing contexts. Navigating the TOP-LEVEL page to
 * the same-origin URL makes Chrome's real full-screen PDF viewer kick in, which
 * is far more reliable on phones. So on mobile we render a prominent
 * "Open preview" button instead of the iframe.
 *
 * Hydration-safe: we detect the pointer on the client only (post-mount), so the
 * server never guesses and desktop users get the iframe immediately.
 */
export default function PdfPreview({ slug, title }: { slug: string; title: string }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const coarse =
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches ||
        window.navigator?.maxTouchPoints > 0);
    setIsMobile(coarse);
  }, []);

  const src = `/api/preview/${slug}`;

  if (isMobile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
        <p className="text-sm text-muted">Preview is best viewed full-screen on your phone.</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer items-center gap-2 bg-lamp px-6 py-3 text-sm font-medium text-ink hover:brightness-110 transition active:translate-y-px"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          Open preview
        </a>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      className="h-full w-full bg-surface"
      title={`${title} preview`}
      allowFullScreen
    />
  );
}
