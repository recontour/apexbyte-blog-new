import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

const SESSION_COOKIE = "__session";
// 7-day session
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const idToken =
    body &&
    typeof body === "object" &&
    "idToken" in body &&
    typeof (body as Record<string, unknown>).idToken === "string"
      ? ((body as Record<string, unknown>).idToken as string)
      : null;

  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    // Verify the Firebase ID token with Admin SDK
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);

    // Optional: restrict to a specific email (your own Google account)
    const allowedEmail = process.env.ADMIN_EMAIL;
    if (allowedEmail && decoded.email !== allowedEmail) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const response = NextResponse.json({ success: true, uid: decoded.uid });

    response.cookies.set(SESSION_COOKIE, decoded.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token verification failed";
    console.error("[/api/auth/session POST]", message);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}

// Sign out — clears the session cookie
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
