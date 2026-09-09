import { NextRequest, NextResponse } from "next/server";
import { searchDepartments, searchPublishedProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ departments: [], projects: [] });
  }

  const [departments, projects] = await Promise.all([
    searchDepartments(q),
    searchPublishedProjects(q),
  ]);

  return NextResponse.json({ departments, projects });
}