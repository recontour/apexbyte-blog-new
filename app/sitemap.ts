import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";

const SITE_URL = "https://apexbyte.blog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Firebase credentials are only available at runtime on Firebase App Hosting.
  // Return a minimal sitemap at build time; ISR revalidates every hour.
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    posts = await getPublishedPosts(500);
  } catch {
    // credentials unavailable at build time
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: post.featured ? 0.9 : 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...postEntries,
  ];
}
