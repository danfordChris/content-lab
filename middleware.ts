import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/api/auth", "/__/", "/generated", "/_next", "/favicon"];

export function middleware(req: NextRequest) {
  // Auth only applies when Firebase is configured; otherwise it's local mode.
  const firebaseEnabled = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  if (!firebaseEnabled) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Presence check only (cookie validity is verified server-side in getCurrentUser).
  if (!req.cookies.has("__session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
