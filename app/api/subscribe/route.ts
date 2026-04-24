import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Naive in-process rate limit: max 5 attempts per IP per 10 minutes.
// Works well enough for a single-instance dev server; on App Hosting each
// instance tracks its own window, which is still a meaningful deterrent.
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_ATTEMPTS) return true;

  entry.count += 1;
  return false;
}

// RFC 5322-inspired but practical email regex
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  // --- Rate limiting ---
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // --- Parse body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email } = body as Record<string, unknown>;

  // --- Validate email ---
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail.length > 254) {
    return NextResponse.json({ error: "Email address is too long." }, { status: 400 });
  }

  // --- Duplicate check + write (via Admin SDK — bypasses Firestore rules) ---
  try {
    const db = getAdminDb();
    const subscribersRef = db.collection("subscribers");

    const existing = await subscribersRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existing.empty) {
      // Return success so we don't leak whether an email is already subscribed
      return NextResponse.json({ success: true });
    }

    await subscribersRef.add({
      email: normalizedEmail,
      subscribedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Subscription failed";
    console.error("[/api/subscribe POST]", message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
