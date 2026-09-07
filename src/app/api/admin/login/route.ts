import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { admins } from "@/db/schema";
import { verifyPassword, createSessionToken, sessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
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
