import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, projectTags } from "@/db/schema";
import { upsertDepartmentByName, findOrCreateTag } from "@/lib/queries";
import {
  buildKey,
  uploadFile,
  deleteFile,
  downloadFile,
  StorageFolder,
} from "@/lib/storage";
import { extractPreviewPages } from "@/lib/pdf-preview";

// Auth for this route is enforced in src/proxy.ts (matches /api/admin/:path*),
// not here — a request only reaches this handler with a valid admin session.
//
// File uploads do NOT come through this request. The browser PUTs the materials
// PDF / source ZIP / screenshot straight to R2 via a short-lived presigned URL
// (see /api/admin/upload-url) because Vercel's serverless functions cap request
// bodies (~4.5MB on Hobby). This route only receives the metadata plus the R2
// file keys the browser was given, then builds the preview from the PDF in R2.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : "";
  const departmentName = typeof body.departmentName === "string" ? body.departmentName : "";
  const year = Number(body.year);
  const level = body.level as "UNDERGRADUATE" | "POSTGRADUATE";
  const abstract = typeof body.abstract === "string" ? body.abstract : "";
  const slug = typeof body.slug === "string" ? body.slug : "";
  const tagsRaw = String(body?.tags ?? "");
  const isSoftware = body.isSoftware === true;
  const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  const materialsKey = typeof body.materialsKey === "string" ? body.materialsKey : "";
  const materialsWordKey = typeof body.materialsWordKey === "string" ? body.materialsWordKey : "";
  const sourceCodeKey = typeof body.sourceCodeKey === "string" ? body.sourceCodeKey : "";
  const screenshotKey = typeof body.screenshotKey === "string" ? body.screenshotKey : "";

  if (!title || !departmentName || !year || !level || !abstract || !slug) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!materialsKey) {
    return NextResponse.json({ error: "The materials PDF was not uploaded" }, { status: 400 });
  }
  if (isSoftware && !sourceCodeKey) {
    return NextResponse.json(
      { error: "The source code ZIP was not uploaded" },
      { status: 400 }
    );
  }

  const department = await upsertDepartmentByName(departmentName, slugify(departmentName));

  // Track every key we might write so a failed attempt cleans up after itself
  // instead of leaving orphaned files in R2.
  const uploadedKeys = [materialsKey];
  if (materialsWordKey) uploadedKeys.push(materialsWordKey);

  try {
    // Build the 10-page preview from the PDF the browser uploaded directly.
    let previewKey = "";
    try {
      const materialsBuffer = await downloadFile(materialsKey);
      const previewBuffer = await extractPreviewPages(materialsBuffer, 10);
      previewKey = buildKey(StorageFolder.Previews, slug, "preview.pdf");
      await uploadFile(previewKey, previewBuffer, "application/pdf");
      uploadedKeys.push(previewKey);
    } catch {
      throw new Error(
        "Could not read that PDF to generate a preview — please check the file isn't corrupted."
      );
    }

    if (sourceCodeKey) uploadedKeys.push(sourceCodeKey);
    if (screenshotKey) uploadedKeys.push(screenshotKey);

    const [project] = await db
      .insert(projects)
      .values({
        title,
        slug,
        abstract,
        year,
        level,
        isSoftware,
        status,
        departmentId: department.id,
        materialsFileKey: materialsKey,
        materialsWordFileKey: materialsWordKey || null,
        previewFileKey: previewKey,
        sourceCodeFileKey: sourceCodeKey || null,
        screenshotFileKey: screenshotKey || null,
      })
      .returning();

    const tagNames = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    for (const name of tagNames) {
      const tag = await findOrCreateTag(name);
      await db.insert(projectTags).values({ projectId: project.id, tagId: tag.id });
    }

    return NextResponse.json({ id: project.id, slug: project.slug });
  } catch (err) {
    // Clean up everything we wrote so a failed attempt doesn't leave orphaned
    // files sitting in R2 forever.
    await Promise.all(uploadedKeys.map((key) => deleteFile(key).catch(() => {})));
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}