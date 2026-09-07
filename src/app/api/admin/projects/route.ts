import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, projectTags } from "@/db/schema";
import { upsertDepartmentByName, findOrCreateTag, slugExists } from "@/lib/queries";
import { buildKey, uploadFile, deleteFile, StorageFolder } from "@/lib/storage";
import { extractPreviewPages } from "@/lib/pdf-preview";

// Auth for this route is enforced in src/proxy.ts (matches /api/admin/:path*),
// not here — a request only reaches this handler with a valid admin session.

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Appends -2, -3, etc. until a free slug is found, so same-title/year
 *  projects (or repeated retries) never silently collide or overwrite
 *  another project's files in storage. */
async function findAvailableSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let attempt = 2;
  while (await slugExists(candidate)) {
    candidate = `${baseSlug}-${attempt}`;
    attempt += 1;
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const title = formData.get("title") as string;
  const departmentName = formData.get("departmentName") as string;
  const year = Number(formData.get("year"));
  const level = formData.get("level") as "UNDERGRADUATE" | "POSTGRADUATE";
  const abstract = formData.get("abstract") as string;
  const tagsRaw = (formData.get("tags") as string) ?? "";
  const isSoftware = formData.get("isSoftware") === "on";
  const status = (formData.get("status") as "DRAFT" | "PUBLISHED") ?? "DRAFT";

  const materialsFile = formData.get("materialsFile") as File | null;
  const sourceCodeFile = formData.get("sourceCodeFile") as File | null;
  const screenshotFile = formData.get("screenshotFile") as File | null;

  if (!title || !departmentName || !year || !level || !abstract) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!materialsFile || materialsFile.size === 0) {
    return NextResponse.json(
      { error: "A materials PDF is required" },
      { status: 400 }
    );
  }
  if (isSoftware && (!sourceCodeFile || sourceCodeFile.size === 0)) {
    return NextResponse.json(
      { error: "Source code ZIP is required for a software project" },
      { status: 400 }
    );
  }

  // Resolve the slug BEFORE any upload happens — uploads use the slug as
  // part of the R2 key, so this must be collision-free first or a same
  // title+year project could silently overwrite another project's files.
  const baseSlug = `${slugify(title)}-${year}`;
  const slug = await findAvailableSlug(baseSlug);

  const department = await upsertDepartmentByName(departmentName, slugify(departmentName));

  // Track every key we upload so we can clean up on failure rather than
  // leaving orphaned files in R2 if a later step (e.g. the DB insert) fails.
  const uploadedKeys: string[] = [];

  try {
    const materialsBuffer = Buffer.from(await materialsFile.arrayBuffer());
    const materialsKey = buildKey(StorageFolder.Materials, slug, "materials.pdf");
    await uploadFile(materialsKey, materialsBuffer, "application/pdf");
    uploadedKeys.push(materialsKey);

    let previewBuffer: Buffer;
    try {
      previewBuffer = await extractPreviewPages(materialsBuffer, 10);
    } catch {
      throw new Error(
        "Could not read that PDF to generate a preview — please check the file isn't corrupted."
      );
    }
    const previewKey = buildKey(StorageFolder.Previews, slug, "preview.pdf");
    await uploadFile(previewKey, previewBuffer, "application/pdf");
    uploadedKeys.push(previewKey);

    let sourceCodeKey: string | undefined;
    if (isSoftware && sourceCodeFile && sourceCodeFile.size > 0) {
      sourceCodeKey = buildKey(StorageFolder.SourceCode, slug, "source.zip");
      await uploadFile(
        sourceCodeKey,
        Buffer.from(await sourceCodeFile.arrayBuffer()),
        "application/zip"
      );
      uploadedKeys.push(sourceCodeKey);
    }

    let screenshotKey: string | undefined;
    if (isSoftware && screenshotFile && screenshotFile.size > 0) {
      screenshotKey = buildKey(
        StorageFolder.Screenshots,
        slug,
        screenshotFile.name || "screenshot.png"
      );
      await uploadFile(
        screenshotKey,
        Buffer.from(await screenshotFile.arrayBuffer()),
        screenshotFile.type || "image/png"
      );
      uploadedKeys.push(screenshotKey);
    }

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
        previewFileKey: previewKey,
        sourceCodeFileKey: sourceCodeKey,
        screenshotFileKey: screenshotKey,
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
    // Clean up anything we already uploaded so a failed attempt doesn't
    // leave orphaned files sitting in R2 forever.
    await Promise.all(uploadedKeys.map((key) => deleteFile(key).catch(() => {})));
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
