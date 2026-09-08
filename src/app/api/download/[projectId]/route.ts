import { NextRequest, NextResponse } from "next/server";
import { getProjectById, incrementDownloadCount } from "@/lib/queries";
import { signedDownloadUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const type = req.nextUrl.searchParams.get("type"); // "materials" | "word" | "source"

  const project = await getProjectById(projectId);
  if (!project || project.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let key: string | null;
  if (type === "source") key = project.sourceCodeFileKey;
  else if (type === "word") key = project.materialsWordFileKey;
  else key = project.materialsFileKey;

  if (!key) {
    return NextResponse.json(
      { error: "Requested file is not available for this project" },
      { status: 404 }
    );
  }

  const url = await signedDownloadUrl(key);

  // Best-effort counter — don't block the response on it.
  incrementDownloadCount(project.id).catch(() => {});

  return NextResponse.json({ url });
}
