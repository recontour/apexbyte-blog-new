import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthors } from "@/lib/posts";

const SESSION_COOKIE = "__session";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const authors = await getAuthors();
    return NextResponse.json({ authors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch authors";
    console.error("[/api/authors]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
