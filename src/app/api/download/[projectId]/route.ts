import { NextRequest, NextResponse } from "next/server";
import { getProjectById, incrementDownloadCount } from "@/lib/queries";
import { signedDownloadUrl } from "@/lib/storage";
import { isDownloadFileType, rewardConfigured, verifyDownloadGrant } from "@/lib/reward";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const type = req.nextUrl.searchParams.get("type"); // "materials" | "word" | "source"
  const grant = req.nextUrl.searchParams.get("grant");

  if (!isDownloadFileType(type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // When rewarded ads are configured this deployment serves download links
  // only to clients holding a signed grant for this exact project + file.
  // The grant is minted server-side and rate-limited, so direct hits on this
  // endpoint can't bypass the ad gate.
  if (rewardConfigured()) {
    if (!grant) {
      return NextResponse.json(
        { error: "Rewarded ad required for download" },
        { status: 403 }
      );
    }
    const claim = await verifyDownloadGrant(grant);
    if (!claim || claim.projectId !== projectId || claim.fileType !== type) {
      return NextResponse.json(
        { error: "Invalid or expired download grant. Please watch the ad again." },
        { status: 403 }
      );
    }
  }

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
