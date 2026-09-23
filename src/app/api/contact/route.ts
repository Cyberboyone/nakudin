import { NextRequest, NextResponse } from "next/server";
import { createMessage } from "@/lib/queries";
import { createRateLimiter, requestIp } from "@/lib/rate-limit";

// A real visitor submits this once, maybe twice. 5/hour/IP is generous room
// for retries and shared-IP situations (a school lab, a NAT) while still
// blocking a script from flooding the inbox with junk.
const takeContactAttempt = createRateLimiter(60 * 60 * 1000, 5);

export async function POST(req: NextRequest) {
  const { name, email, body, relatedProjectSlug } = await req.json();

  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const { allowed, retryAfterSeconds } = takeContactAttempt(requestIp(req));
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again later.", retryAfterSeconds },
      { status: 429 }
    );
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
