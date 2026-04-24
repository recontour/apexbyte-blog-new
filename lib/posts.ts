import { getAdminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ── Content block types ──────────────────────────────────────────────────────

export type HeadingBlock = {
  type: "heading";
  level: 2 | 3;
  text: string;
};

export type ParagraphBlock = {
  type: "paragraph";
  html: string;
};

export type CodeBlock = {
  type: "code";
  language: string;
  code: string;
};

export type CalloutBlock = {
  type: "callout";
  variant: "info" | "warning" | "tip";
  text: string;
};

export type ImageBlock = {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
};

export type ListBlock = {
  type: "list";
  ordered: boolean;
  items: string[];
};

export type ChartBlock = {
  type: "chart";
  chartType: "bar" | "line" | "pie";
  title: string;
  xKey: string;
  yKey: string;
  data: Record<string, unknown>[];
};

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | CodeBlock
  | CalloutBlock
  | ImageBlock
  | ListBlock
  | ChartBlock;

// ── Post types ───────────────────────────────────────────────────────────────

export type PostStatus = "draft" | "published";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatarUrl: string | null;
  };
  coverImage: string | null;
  readTime: string;
  publishedAt: string;   // ISO string — Firestore Timestamps are converted on read
  updatedAt: string;
  status: PostStatus;
  featured: boolean;
  blocks: ContentBlock[];
};

export type PostSummary = Omit<Post, "blocks">;

// ── Helpers ──────────────────────────────────────────────────────────────────

function toISOString(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function docToPost(slug: string, data: FirebaseFirestore.DocumentData): Post {
  return {
    slug,
    title: data.title ?? "",
    excerpt: data.excerpt ?? "",
    category: data.category ?? "",
    tags: data.tags ?? [],
    author: {
      name: data.author?.name ?? "ApexByte",
      avatarUrl: data.author?.avatarUrl ?? null,
    },
    coverImage: data.coverImage ?? null,
    readTime: data.readTime ?? "5 min read",
    publishedAt: toISOString(data.publishedAt),
    updatedAt: toISOString(data.updatedAt),
    status: data.status ?? "draft",
    featured: data.featured ?? false,
    blocks: data.blocks ?? [],
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch a single published post by slug. Returns null if not found or draft. */
export async function getPost(slug: string): Promise<Post | null> {
  const doc = await getAdminDb().collection("posts").doc(slug).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.status !== "published") return null;
  return docToPost(slug, data);
}

/** Fetch all published posts ordered by publishedAt desc, for the homepage. */
export async function getPublishedPosts(limit = 20): Promise<PostSummary[]> {
  const snap = await getAdminDb()
    .collection("posts")
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const { blocks: _blocks, ...summary } = docToPost(doc.id, doc.data());
    return summary;
  });
}

/** Fetch the single featured post for the homepage hero. */
export async function getFeaturedPost(): Promise<PostSummary | null> {
  const snap = await getAdminDb()
    .collection("posts")
    .where("status", "==", "published")
    .where("featured", "==", true)
    .orderBy("publishedAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  const { blocks: _blocks, ...summary } = docToPost(doc.id, doc.data());
  return summary;
}

/** Fetch all published slugs — used by generateStaticParams for ISR. */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const snap = await getAdminDb()
    .collection("posts")
    .where("status", "==", "published")
    .select()   // fetch no fields, just doc IDs — cheapest possible read
    .get();

  return snap.docs.map((doc) => doc.id);
}

/** Fetch all posts (any status) for the admin dashboard. */
export async function getAllPostsForAdmin(): Promise<PostSummary[]> {
  const snap = await getAdminDb()
    .collection("posts")
    .orderBy("updatedAt", "desc")
    .get();

  return snap.docs.map((doc) => {
    const { blocks: _blocks, ...summary } = docToPost(doc.id, doc.data());
    return summary;
  });
}

/** Save a post (create or overwrite). Used by the publish API route. */
export async function savePost(
  slug: string,
  data: Omit<Post, "slug" | "publishedAt" | "updatedAt"> & {
    publishedAt?: string;
  }
): Promise<void> {
  const isNew = !(await getAdminDb().collection("posts").doc(slug).get()).exists;

  await getAdminDb()
    .collection("posts")
    .doc(slug)
    .set({
      ...data,
      publishedAt: isNew
        ? FieldValue.serverTimestamp()
        : data.publishedAt
          ? new Date(data.publishedAt)
          : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/** Delete a post. Used by the admin dashboard. */
export async function deletePost(slug: string): Promise<void> {
  await getAdminDb().collection("posts").doc(slug).delete();
}

// ── Authors ──────────────────────────────────────────────────────────────────

export type AuthorSummary = {
  name: string;
  avatarUrl: string | null;
  postCount: number;
};

/**
 * Scan all posts and return a deduplicated list of authors with their current
 * avatar URL and how many posts they have. Used by the /admin/avatar page.
 */
export async function getAuthors(): Promise<AuthorSummary[]> {
  const snap = await getAdminDb()
    .collection("posts")
    .select("author")
    .get();

  const map = new Map<string, AuthorSummary>();
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const name: string = data.author?.name ?? "ApexByte";
    const avatarUrl: string | null = data.author?.avatarUrl ?? null;
    const existing = map.get(name);
    if (existing) {
      existing.postCount += 1;
      // Prefer a non-null avatar if we find one
      if (!existing.avatarUrl && avatarUrl) existing.avatarUrl = avatarUrl;
    } else {
      map.set(name, { name, avatarUrl, postCount: 1 });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.postCount - a.postCount);
}


