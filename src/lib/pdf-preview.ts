import { PDFDocument } from "pdf-lib";

/**
 * Given the full materials PDF (as a Buffer), returns a new PDF Buffer
 * containing only the first `pageLimit` pages — this is what gets uploaded
 * to the public "previews" folder in R2 and embedded on the project page.
 *
 * Doing this at upload time (server-side) rather than limiting pages in the
 * frontend viewer is the safer approach — it means there is no full document
 * to find in devtools/network tab, only the preview file ever ships to the
 * browser before a paid... (well, ad-supported) download click.
 */
export async function extractPreviewPages(
  fullPdfBuffer: Buffer,
  pageLimit = 10
): Promise<Buffer> {
  const srcDoc = await PDFDocument.load(fullPdfBuffer);
  const previewDoc = await PDFDocument.create();

  const totalPages = srcDoc.getPageCount();
  const pagesToCopy = Math.min(pageLimit, totalPages);
  const indices = Array.from({ length: pagesToCopy }, (_, i) => i);

  const copiedPages = await previewDoc.copyPages(srcDoc, indices);
  copiedPages.forEach((page) => previewDoc.addPage(page));

  // If the doc is shorter than the page limit, note it wasn't truncated —
  // useful later if you want to show "full document" vs "preview" in the UI.
  const bytes = await previewDoc.save();
  return Buffer.from(bytes);
}
