import { NextRequest, NextResponse } from "next/server";
import { createMessage } from "@/lib/queries";

export async function POST(req: NextRequest) {
  const { name, email, body, relatedProjectSlug } = await req.json();

  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  await createMessage({
    name: typeof name === "string" && name.trim() ? name.trim() : undefined,
    email: typeof email === "string" && email.trim() ? email.trim() : undefined,
    body: body.trim(),
    relatedProjectSlug:
      typeof relatedProjectSlug === "string" && relatedProjectSlug.trim()
        ? relatedProjectSlug.trim()
        : undefined,
  });

  return NextResponse.json({ ok: true });
}
