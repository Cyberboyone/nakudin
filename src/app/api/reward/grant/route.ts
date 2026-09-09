import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/lib/queries";
import {
  isDownloadFileType,
  rewardConfigured,
  signDownloadGrant,
  takeGrantAttempt,
} from "@/lib/reward";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rewardConfigured()) {
    return NextResponse.json(
      { error: "Rewarded downloads are not enabled on this deployment" },
      { status: 403 }
    );
  }

  let body: { projectId?: string; fileType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { projectId, fileType } = body ?? {};
  if (typeof projectId !== "string" || !isDownloadFileType(fileType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const project = await getProjectById(projectId);
  if (!project || project.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const key =
    fileType === "source"
      ? project.sourceCodeFileKey
      : fileType === "word"
        ? project.materialsWordFileKey
        : project.materialsFileKey;
  if (!key) {
    return NextResponse.json(
      { error: "Requested file is not available for this project" },
      { status: 404 }
    );
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const { allowed, retryAfterSeconds } = takeGrantAttempt(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many rewarded downloads. Please try again later.", retryAfterSeconds },
      { status: 429 }
    );
  }

  const token = await signDownloadGrant(projectId, fileType);
  return NextResponse.json({ token });
}