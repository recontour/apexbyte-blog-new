import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/gemini";

export const maxDuration = 300; // Gemini 3 Flash Preview can take 60–120s for full structured posts

export async function POST(request: NextRequest) {
  // Validate content type
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

  if (
    !body ||
    typeof body !== "object" ||
    !("prompt" in body) ||
    typeof (body as Record<string, unknown>).prompt !== "string"
  ) {
    return NextResponse.json({ error: "Missing required field: prompt (string)" }, { status: 400 });
  }

  const prompt = ((body as Record<string, unknown>).prompt as string).trim();

  if (prompt.length === 0) {
    return NextResponse.json({ error: "Prompt cannot be empty" }, { status: 400 });
  }

  if (prompt.length > 2000) {
    return NextResponse.json({ error: "Prompt must be 2000 characters or fewer" }, { status: 400 });
  }

  try {
    console.log("[/api/generate] Starting generation, prompt length:", prompt.length);
    const t0 = Date.now();
    const post = await generatePost(prompt);
    console.log(`[/api/generate] Done in ${Date.now() - t0}ms`);
    return NextResponse.json({ post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[/api/generate] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
