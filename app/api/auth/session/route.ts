import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminConfigured } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/auth";

const EXPIRES_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

/** Exchange a Firebase ID token for an httpOnly session cookie. */
export async function POST(req: NextRequest) {
  if (!adminConfigured) {
    return NextResponse.json({ error: "Firebase not configured" }, { status: 400 });
  }
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

  try {
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: EXPIRES_MS });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      maxAge: EXPIRES_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auth failed" },
      { status: 401 }
    );
  }
}

/** Sign out — clear the session cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
