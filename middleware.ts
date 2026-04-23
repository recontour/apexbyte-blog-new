import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/admin", "/api/generate", "/api/publish"];
const LOGIN_PATH = "/admin/login";
const SESSION_COOKIE = "__session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isProtected) return NextResponse.next();

  // Allow the login page through unconditionally
  if (pathname === LOGIN_PATH) return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE);

  if (!session?.value) {
    // API routes return 401; page routes redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/generate/:path*", "/api/publish/:path*"],
};
