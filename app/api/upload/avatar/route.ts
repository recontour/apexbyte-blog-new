import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { getAdminStorage, getAdminDb } from "@/lib/firebase-admin";

const SESSION_COOKIE = "__session";
// Sanitise an author name into a stable storage key, e.g. "Maya Chen" → "maya-chen"
function toAuthorId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse form data ───────────────────────────────────────────────────────
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const authorName = formData.get("authorName");
  const file = formData.get("file");

  if (typeof authorName !== "string" || authorName.trim().length === 0) {
    return NextResponse.json({ error: "Missing authorName" }, { status: 400 });
  }

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  // Accept any image type — sharp handles the conversion
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  // 10 MB raw input limit (sharp will compress it down to ~20-30 KB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
  }

  try {
    // ── Optimise: 128×128 square crop, WebP quality 80 (~20-30 KB) ──────────
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const optimised = await sharp(inputBuffer)
      .resize(128, 128, { fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toBuffer();

    // ── Upload to Firebase Storage ────────────────────────────────────────
    const authorId = toAuthorId(authorName.trim());
    const storagePath = `avatars/${authorId}.webp`;
    const bucket = getAdminStorage().bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(optimised, {
      metadata: { contentType: "image/webp" },
      resumable: false,
    });
    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // ── Batch-update all posts with this author name ──────────────────────
    const db = getAdminDb();
    const snap = await db
      .collection("posts")
      .where("author.name", "==", authorName.trim())
      .get();

    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { "author.avatarUrl": url });
      });
      await batch.commit();
    }

    return NextResponse.json({ url, updatedPosts: snap.size });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[/api/upload/avatar]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
