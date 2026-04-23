import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPost, getAllPublishedSlugs } from "@/lib/posts";
import BlockRenderer from "@/components/blog/BlockRenderer";

const SITE_URL = "https://apexbyte.blog";
const SITE_NAME = "ApexByte";

// ── ISR: revalidate every hour, generate known slugs at build time ────────────

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // Firebase credentials are not available at build time (e.g. Firebase App
    // Hosting injects secrets only at runtime). Return an empty array so the
    // build succeeds; ISR will generate and cache each page on first request.
    return [];
  }
}

// ── SEO metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };

  const url = `${SITE_URL}/blog/${slug}`;

  return {
    title: `${post.title} — ${SITE_NAME}`,
    description: post.excerpt,
    authors: [{ name: post.author.name }],
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      siteName: SITE_NAME,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      ...(post.coverImage
        ? { images: [{ url: post.coverImage, width: 1600, height: 900, alt: post.title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${slug}`;

  // JSON-LD structured data — BlogPosting schema for SEO & AI search
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    keywords: post.tags.join(", "),
    articleSection: post.category,
    ...(post.coverImage ? { image: post.coverImage } : {}),
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  const publishDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      {/* JSON-LD — XSS-safe */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="min-h-screen bg-surface">
        {/* ── Nav ── */}
        <header className="sticky top-0 z-50 bg-[rgba(250,250,250,0.85)] backdrop-blur-md border-b border-border">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 flex items-center justify-between h-14">
            <Link href="/" className="text-[17px] font-semibold tracking-tight text-ink">
              Apex<span className="text-accent">Byte</span>
            </Link>
            <Link
              href="/"
              className="text-[13px] font-medium text-muted hover:text-ink transition-colors"
            >
              ← All articles
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 sm:px-8 pb-24">
          {/* ── Hero ── */}
          <article>
            <header className="mt-10 sm:mt-14 mb-8">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-accent mb-4">
                {post.category}
              </p>
              <h1
                className="font-serif text-[28px] sm:text-[40px] font-semibold leading-tight text-ink mb-5"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {post.title}
              </h1>
              <p className="text-[16px] sm:text-[18px] leading-relaxed text-ink-secondary mb-7 max-w-2xl">
                {post.excerpt}
              </p>

              {/* Author + meta */}
              <div className="flex items-center gap-3 pb-7 border-b border-border">
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.name}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-[13px] font-semibold text-muted shrink-0">
                    {post.author.name[0]}
                  </div>
                )}
                <div>
                  <p className="text-[13px] font-medium text-ink">{post.author.name}</p>
                  <p className="text-[12px] text-muted">
                    <time dateTime={post.publishedAt}>{publishDate}</time>
                    {" · "}
                    {post.readTime}
                  </p>
                </div>

                {/* Tags */}
                <div className="ml-auto flex gap-2 flex-wrap justify-end">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            {/* Cover image */}
            {post.coverImage && (
              <div className="mb-10 rounded-2xl overflow-hidden border border-border">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  width={1600}
                  height={900}
                  className="w-full object-cover"
                  priority
                />
              </div>
            )}

            {/* Article body */}
            <BlockRenderer blocks={post.blocks} />
          </article>

          {/* ── Footer nav ── */}
          <div className="mt-16 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
            <Link
              href="/"
              className="text-[13px] font-medium text-muted hover:text-ink transition-colors"
            >
              ← Back to all articles
            </Link>
            <div className="flex gap-2 flex-wrap">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 text-[12px] font-medium text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-border bg-white mt-8">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
              Apex<span className="text-accent">Byte</span>
            </Link>
            <p className="text-[12px] text-muted">© 2026 ApexByte</p>
          </div>
        </footer>
      </div>
    </>
  );
}
