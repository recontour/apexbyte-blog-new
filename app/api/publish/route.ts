import { NextRequest, NextResponse } from "next/server";
import { savePost } from "@/lib/posts";
import type { Post } from "@/lib/posts";

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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // Validate required fields
  const required = ["slug", "title", "excerpt", "category", "tags", "readTime", "author", "blocks", "status"];
  for (const field of required) {
    if (!(field in data)) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const slug = data.slug as string;

  // Slugs must be safe: lowercase letters, numbers, hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
      { status: 400 }
    );
  }

  try {
    const { slug: _slug, publishedAt, updatedAt: _updatedAt, ...rest } = data as Partial<Post>;
    await savePost(slug, {
      ...(rest as Omit<Post, "slug" | "publishedAt" | "updatedAt">),
      ...(publishedAt ? { publishedAt } : {}),
    });
    return NextResponse.json({ success: true, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save post";
    console.error("[/api/publish]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
