import { NextRequest, NextResponse } from "next/server";
import { createMessage } from "@/lib/queries";
import { isServiceType } from "@/lib/services";
import { createRateLimiter, requestIp } from "@/lib/rate-limit";

// Same reasoning as the contact form's limiter: generous enough for a real
// visitor, tight enough to block a flood of scripted requests.
const takeServiceRequestAttempt = createRateLimiter(60 * 60 * 1000, 5);

export async function POST(req: NextRequest) {
  const { allowed, retryAfterSeconds } = takeServiceRequestAttempt(requestIp(req));
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests sent. Please try again later.", retryAfterSeconds },
      { status: 429 }
    );
  }

  const body = await req.json();

  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : "";
  const email =
    typeof body.email === "string" && body.email.trim() ? body.email.trim() : "";
  const phone =
    typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : "";
  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : "";
  const serviceType = typeof body.serviceType === "string" ? body.serviceType : "";
  const topic =
    typeof body.topic === "string" && body.topic.trim() ? body.topic.trim() : null;
  const budget =
    typeof body.budget === "string" && body.budget.trim() ? body.budget.trim() : null;
  const deadline =
    typeof body.deadline === "string" && body.deadline.trim()
      ? body.deadline.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email && !phone) {
    return NextResponse.json(
      { error: "At least an email or phone number is required" },
      { status: 400 }
    );
  }
  if (!message) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }
  if (!isServiceType(serviceType)) {
    return NextResponse.json(
      { error: "Please select a service" },
      { status: 400 }
    );
  }

  await createMessage({
    kind: "service",
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    body: message,
    serviceType,
    topic,
    budget,
    deadline,
  });

  return NextResponse.json({ ok: true });
}