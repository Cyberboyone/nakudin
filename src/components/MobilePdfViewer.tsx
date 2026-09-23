"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Keep this in the same module as <Document>/<Page>, per react-pdf's own
// setup docs — resolving the worker via import.meta.url keeps it in lockstep
// with whatever pdfjs-dist version is actually installed (no manual copying
// to /public, no separately-versioned CDN file to fall out of sync with).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * Renders every page of the PDF at `src` as canvases, right in the page.
 *
 * This exists because handing a PDF URL to the OS (a plain link/iframe) means
 * Android decides how to open it — and on a phone where some other app (a
 * PDF reader, a files app) is set as the default handler, Android downloads
 * the file and hands it off instead of letting Chrome show it. That's a
 * per-visitor device setting we have no control over. Rendering the pages
 * ourselves with pdf.js sidesteps that entirely: it looks the same on every
 * phone regardless of what's installed.
 *
 * Loaded via next/dynamic(..., { ssr: false }) from PdfPreview — pdf.js
 * touches browser-only APIs (DOMMatrix, canvas) at module load, which don't
 * exist during server rendering.
 */
export default function MobilePdfViewer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
        <p className="text-sm text-muted">Couldn&apos;t load the preview here.</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer items-center gap-2 bg-lamp px-6 py-3 text-sm font-medium text-ink hover:brightness-110 transition active:translate-y-px"
        >
          Open in a new tab
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-surface">
      <Document
        file={src}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setFailed(true)}
        suspense={false}
        loading={
          <p className="p-6 text-center text-sm text-muted">Loading preview…</p>
        }
        error={
          <p className="p-6 text-center text-sm text-muted">Couldn&apos;t load the preview.</p>
        }
      >
        {width > 0 &&
          Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="[&+&]:mt-2"
              loading=""
            />
          ))}
      </Document>
    </div>
  );
}
