import { NextRequest, NextResponse } from "next/server";
import {
  getProjectByIdForAdmin,
  updateProjectFields,
  replaceProjectTags,
  deleteProjectById,
  upsertDepartmentByName,
} from "@/lib/queries";
import { buildKey, uploadFile, deleteFile, StorageFolder } from "@/lib/storage";
import { extractPreviewPages } from "@/lib/pdf-preview";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getProjectByIdForAdmin(id);
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

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

  const department = await upsertDepartmentByName(departmentName, slugify(departmentName));

  const updates: Record<string, unknown> = {
    title,
    abstract,
    year,
    level,
    isSoftware,
    status,
    departmentId: department.id,
  };

  // Only touch files the admin actually re-uploaded — leave the rest as-is.
  if (materialsFile && materialsFile.size > 0) {
    const materialsBuffer = Buffer.from(await materialsFile.arrayBuffer());
    const materialsKey = buildKey(StorageFolder.Materials, existing.slug, "materials.pdf");
    await uploadFile(materialsKey, materialsBuffer, "application/pdf");
    updates.materialsFileKey = materialsKey;

    const previewBuffer = await extractPreviewPages(materialsBuffer, 10);
    const previewKey = buildKey(StorageFolder.Previews, existing.slug, "preview.pdf");
    await uploadFile(previewKey, previewBuffer, "application/pdf");
    updates.previewFileKey = previewKey;
  }

  if (isSoftware && sourceCodeFile && sourceCodeFile.size > 0) {
    const sourceCodeKey = buildKey(StorageFolder.SourceCode, existing.slug, "source.zip");
    await uploadFile(
      sourceCodeKey,
      Buffer.from(await sourceCodeFile.arrayBuffer()),
      "application/zip"
    );
    updates.sourceCodeFileKey = sourceCodeKey;
  } else if (!isSoftware) {
    // Switched from software to non-software — drop the old source file reference.
    if (existing.sourceCodeFileKey) {
      await deleteFile(existing.sourceCodeFileKey).catch(() => {});
    }
    updates.sourceCodeFileKey = null;
  }

  if (isSoftware && screenshotFile && screenshotFile.size > 0) {
    const screenshotKey = buildKey(
      StorageFolder.Screenshots,
      existing.slug,
      screenshotFile.name || "screenshot.png"
    );
    await uploadFile(
      screenshotKey,
      Buffer.from(await screenshotFile.arrayBuffer()),
      screenshotFile.type || "image/png"
    );
    updates.screenshotFileKey = screenshotKey;
  } else if (!isSoftware) {
    if (existing.screenshotFileKey) {
      await deleteFile(existing.screenshotFileKey).catch(() => {});
    }
    updates.screenshotFileKey = null;
  }

  await updateProjectFields(id, updates);

  const tagNames = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  await replaceProjectTags(id, tagNames);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProjectByIdForAdmin(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Best-effort file cleanup — don't let a storage hiccup block the DB delete.
  await Promise.all(
    [
      project.materialsFileKey,
      project.previewFileKey,
      project.sourceCodeFileKey,
      project.screenshotFileKey,
    ]
      .filter((key): key is string => Boolean(key))
      .map((key) => deleteFile(key).catch(() => {}))
  );

  await deleteProjectById(id);

  return NextResponse.json({ ok: true });
}
