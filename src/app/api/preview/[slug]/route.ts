import { NextResponse } from "next/server";

import { getProjectBySlug } from "@/lib/queries";
import { downloadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Same-origin PDF preview proxy.
 *
 * The project page embeds the materials preview PDF in an <iframe>. It used to
 * point straight at the R2 public URL (cross-origin). Chrome on Android refuses
 * to inline-render a cross-origin PDF inside an iframe — the box is blank (or it
 * silently triggers a download) instead of showing the document.
 *
 * Serving the PDF bytes from the same origin with
 *   Content-Type: application/pdf
 *   Content-Disposition: inline
 * makes Android Chrome's built-in viewer render reliably. It also removes the
 * redirect hop to R2 that Search Console keeps reporting as "Page with redirect".
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project || !project.previewFileKey) {
    return new NextResponse(JSON.stringify({ error: "Preview not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pdf = await downloadFile(project.previewFileKey);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="preview.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
