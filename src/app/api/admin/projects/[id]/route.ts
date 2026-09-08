import { NextRequest, NextResponse } from "next/server";
import {
  getProjectByIdForAdmin,
  updateProjectFields,
  replaceProjectTags,
  deleteProjectById,
  upsertDepartmentByName,
} from "@/lib/queries";
import {
  buildKey,
  uploadFile,
  deleteFile,
  downloadFile,
  StorageFolder,
} from "@/lib/storage";
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

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : "";
  const departmentName = typeof body.departmentName === "string" ? body.departmentName : "";
  const year = Number(body.year);
  const level = body.level as "UNDERGRADUATE" | "POSTGRADUATE";
  const abstract = typeof body.abstract === "string" ? body.abstract : "";
  const tagsRaw = String(body?.tags ?? "");
  const isSoftware = body.isSoftware === true;
  const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  // Keys for files the browser uploaded directly to R2 (only present when a
  // replacement was chosen). Nothing else arrives as a file body on this route.
  const materialsKey = typeof body.materialsKey === "string" ? body.materialsKey : "";
  const materialsWordKey = typeof body.materialsWordKey === "string" ? body.materialsWordKey : "";
  const sourceCodeKey = typeof body.sourceCodeKey === "string" ? body.sourceCodeKey : "";
  const screenshotKey = typeof body.screenshotKey === "string" ? body.screenshotKey : "";

  if (!title || !departmentName || !year || !level || !abstract) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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

  const uploadedKeys: string[] = [];

  try {
    // Replace the materials PDF only if a new one was uploaded — and rebuild
    // the preview from it, cleaning up the old preview file.
    if (materialsKey) {
      uploadedKeys.push(materialsKey);
      const materialsBuffer = await downloadFile(materialsKey);
      const previewBuffer = await extractPreviewPages(materialsBuffer, 10);
      const previewKey = buildKey(StorageFolder.Previews, existing.slug, "preview.pdf");

      // Upload the new preview, then remove the old materials + preview files.
      await uploadFile(previewKey, previewBuffer, "application/pdf");
      uploadedKeys.push(previewKey);
      await Promise.all(
        [existing.materialsFileKey, existing.previewFileKey]
          .filter((key): key is string => Boolean(key) && key !== materialsKey && key !== previewKey)
          .map((key) => deleteFile(key).catch(() => {}))
      );

      updates.materialsFileKey = materialsKey;
      updates.previewFileKey = previewKey;
    }

    // Replace the Word materials only if a new one was uploaded. No preview
    // rebuild needed — the preview always comes from the PDF.
    if (materialsWordKey) {
      uploadedKeys.push(materialsWordKey);
      if (existing.materialsWordFileKey && existing.materialsWordFileKey !== materialsWordKey) {
        await deleteFile(existing.materialsWordFileKey).catch(() => {});
      }
      updates.materialsWordFileKey = materialsWordKey;
    }

    if (sourceCodeKey) {
      uploadedKeys.push(sourceCodeKey);
      await Promise.all(
        [existing.sourceCodeFileKey]
          .filter((key): key is string => Boolean(key) && key !== sourceCodeKey)
          .map((key) => deleteFile(key).catch(() => {}))
      );
      updates.sourceCodeFileKey = sourceCodeKey;
    } else if (!isSoftware) {
      // Switched from software to non-software — drop the old source file reference.
      if (existing.sourceCodeFileKey) {
        await deleteFile(existing.sourceCodeFileKey).catch(() => {});
      }
      updates.sourceCodeFileKey = null;
    }

    if (screenshotKey) {
      uploadedKeys.push(screenshotKey);
      await Promise.all(
        [existing.screenshotFileKey]
          .filter((key): key is string => Boolean(key) && key !== screenshotKey)
          .map((key) => deleteFile(key).catch(() => {}))
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
  } catch (err) {
    // Best-effort cleanup of anything this edit uploaded before it failed.
    await Promise.all(uploadedKeys.map((key) => deleteFile(key).catch(() => {})));
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

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
      project.materialsWordFileKey,
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