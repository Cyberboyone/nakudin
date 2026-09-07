import { NextRequest, NextResponse } from "next/server";
import { buildKey, getUploadUrl, StorageFolder } from "@/lib/storage";
import { slugExists } from "@/lib/queries";

// Auth for this route is enforced in src/proxy.ts — requests only reach it
// with a valid admin session, same as the other /api/admin routes.

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Appends -2, -3, etc. until a free slug is found, matching the create route. */
async function findAvailableSlug(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let attempt = 2;
  while (await slugExists(candidate)) {
    candidate = `${baseSlug}-${attempt}`;
    attempt += 1;
  }
  return candidate;
}

/** The file kinds the upload form can send straight to R2. */
type UploadKind = "materials" | "source" | "screenshot";

const KIND_DEFAULTS: Record<UploadKind, { folder: string; filename: string; contentType: string }> = {
  materials: {
    folder: StorageFolder.Materials,
    filename: "materials.pdf",
    contentType: "application/pdf",
  },
  source: {
    folder: StorageFolder.SourceCode,
    filename: "source.zip",
    contentType: "application/zip",
  },
  screenshot: {
    folder: StorageFolder.Screenshots,
    filename: "screenshot.png",
    contentType: "image/png",
  },
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // A create upload resolves its own slug; an edit passes the existing one.
  let slug = typeof body.slug === "string" && body.slug ? body.slug : "";
  if (!slug) {
    const title = typeof body.title === "string" ? body.title : "";
    const year = Number(body.year);
    if (!title || !year) {
      return NextResponse.json(
        { error: "A title and year are required to allocate a slug" },
        { status: 400 }
      );
    }
    slug = await findAvailableSlug(`${slugify(title)}-${year}`);
  }

  const requested = Array.isArray(body.files) ? body.files : [];
  if (requested.length === 0) {
    return NextResponse.json({ error: "No files requested" }, { status: 400 });
  }

  const isValidKind = (k: unknown): k is UploadKind =>
    k === "materials" || k === "source" || k === "screenshot";

  // Guard against a caller requesting MIME types that don't match the kind,
  // so presigned URLs can't be misused to write arbitrary content.
  const uploads: { kind: UploadKind; key: string; url: string }[] = [];
  for (const f of requested) {
    const kind = f.kind;
    if (!isValidKind(kind)) {
      return NextResponse.json({ error: `Unknown file kind: ${String(kind)}` }, { status: 400 });
    }
    const defaults = KIND_DEFAULTS[kind];
    const filename =
      typeof f.filename === "string" && f.filename ? f.filename : defaults.filename;
    const contentType =
      typeof f.contentType === "string" && f.contentType ? f.contentType : defaults.contentType;

    if (kind === "materials" && contentType !== "application/pdf") {
      return NextResponse.json(
        { error: "The materials file must be a PDF" },
        { status: 400 }
      );
    }
    if (kind === "source" && contentType !== "application/zip") {
      return NextResponse.json(
        { error: "The source code file must be a ZIP" },
        { status: 400 }
      );
    }

    const key = buildKey(defaults.folder, slug, filename);
    const url = await getUploadUrl(key, contentType);
    uploads.push({ kind, key, url });
  }

  return NextResponse.json({ slug, uploads });
}