"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MobilePdfViewer = dynamic(() => import("./MobilePdfViewer"), {
  ssr: false,
  loading: () => (
    <p className="flex h-full items-center justify-center bg-surface p-6 text-center text-sm text-muted">
      Loading preview…
    </p>
  ),
});

/**
 * PDF preview that works on Android Chrome.
 *
 * Desktop / fine-pointer: keep the inline iframe (same-origin proxy at
 * /api/preview/:slug renders PDFs well in Chrome desktop, Safari, Firefox).
 *
 * Mobile / coarse-pointer: handing the PDF to the OS (an iframe, or a link the
 * OS opens) means the visitor's phone decides how to open it — and on a
 * phone with some other app set as the default PDF handler, that means a
 * download instead of a view. MobilePdfViewer renders the pages ourselves
 * with pdf.js instead, so it looks the same regardless of what's installed
 * on the visitor's phone. It's loaded client-only (see that file for why).
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
    return <MobilePdfViewer src={src} />;
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
