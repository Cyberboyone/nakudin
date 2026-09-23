import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { admins } from "@/db/schema";
import { verifyPassword, createSessionToken, sessionCookie } from "@/lib/auth";
import { createRateLimiter, requestIp } from "@/lib/rate-limit";

// bcrypt already slows down brute-forcing, but with no cap at all an attacker
// can still grind through a password list. 5 attempts / 15 minutes / IP is
// the standard login-throttling number — generous for a real admin who
// mistypes, tight for a script.
const takeLoginAttempt = createRateLimiter(15 * 60 * 1000, 5);

export async function POST(req: NextRequest) {
  const { allowed, retryAfterSeconds } = takeLoginAttempt(requestIp(req));
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later.", retryAfterSeconds },
      { status: 429 }
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email.trim().toLowerCase()))
    .limit(1);
  const admin = rows[0];

  // Same generic error whether the email doesn't exist or the password is
  // wrong — don't leak which admin emails exist.
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSessionToken(admin.id, admin.email);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sessionCookie.maxAge,
    path: "/",
  });
  return res;
}
