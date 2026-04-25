import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostsByTag, getTags, getCategories } from "@/lib/posts";
import MobileNav from "@/components/blog/MobileNav";
import NewsletterForm from "@/components/blog/NewsletterForm";

export const dynamic = "force-dynamic";

const EXTERNAL_NAV = [
  { label: "Our Site", href: "https://www.apexbyte.co/" },
  { label: "Contact", href: "https://www.apexbyte.co/contact" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Words that should be fully uppercased
const UPPERCASE_WORDS = new Set(["ai", "ml", "api", "css", "html", "ui", "ux", "ci", "cd", "orm"]);

function formatTag(tag: string) {
  return tag
    .split(" ")
    .map((word) =>
      UPPERCASE_WORDS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = decodeURIComponent(slug);
  return {
    title: `${tag} — ApexByte`,
    description: `Articles tagged "${tag}" on ApexByte.`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = decodeURIComponent(slug);

  let posts: Awaited<ReturnType<typeof getPostsByTag>> = [];
  let allTags: string[] = [];
  let navCategories: string[] = [];
  try {
    [posts, allTags, navCategories] = await Promise.all([
      getPostsByTag(tag),
      getTags(),
      getCategories(),
    ]);
  } catch (err) {
    console.error("[tag page] Firestore error:", err);
  }

  // 404 if the tag doesn't exist at all
  if (allTags.length > 0 && !allTags.includes(tag)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[rgba(250,250,250,0.85)] backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[17px] font-semibold tracking-tight text-ink">
              Apex<span className="text-accent">Byte</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-7 text-[13px] font-medium text-ink-secondary">
            {navCategories.map((item) => (
              <Link
                key={item}
                href={`/category/${encodeURIComponent(item)}`}
                className="hover:text-ink transition-colors"
              >
                {item}
              </Link>
            ))}
            <span className="w-px h-4 bg-border" />
            {EXTERNAL_NAV.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#newsletter"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover transition-colors rounded-full px-4 py-1.5"
          >
            Subscribe
          </a>

          <MobileNav categories={navCategories} />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-5 sm:px-8 pb-24">
        {/* Heading */}
        <section className="mt-12 sm:mt-16">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-accent mb-2">
            Topic
          </p>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-ink"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {formatTag(tag)}
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </section>

        {/* Posts */}
        {posts.length > 0 ? (
          <section className="mt-10">
            <div className="divide-y divide-border">
              {posts.map((post, index) => (
                <article key={post.slug} className="py-7 group">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold tracking-widest uppercase text-accent mb-2">
                        {post.category}
                      </p>
                      <h3
                        className="text-[18px] sm:text-[20px] font-semibold leading-snug text-ink mb-2 group-hover:text-accent transition-colors"
                        style={{ fontFamily: "var(--font-playfair)" }}
                      >
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-[14px] leading-relaxed text-ink-secondary line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>

                    {post.coverImage ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="sm:ml-8 shrink-0 w-full sm:w-28 h-24 sm:h-20 rounded-xl overflow-hidden relative block"
                      >
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          loading={index === 0 ? "eager" : "lazy"}
                          priority={index === 0}
                        />
                      </Link>
                    ) : (
                      <div className="sm:ml-8 shrink-0 w-full sm:w-28 h-24 sm:h-20 rounded-xl bg-linear-to-br from-border to-[#d2d2d7] overflow-hidden" />
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    {post.author.avatarUrl ? (
                      <Image
                        src={post.author.avatarUrl}
                        alt={post.author.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-[10px] font-semibold text-muted">
                        {post.author.name[0]}
                      </div>
                    )}
                    <span className="text-[12px] text-muted">
                      {post.author.name} · {formatDate(post.publishedAt)} · {post.readTime}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-16 text-center py-24">
            <p className="text-[15px] text-muted">No posts with this topic yet.</p>
          </section>
        )}

        {/* Newsletter CTA */}
        <section id="newsletter" className="mt-16 rounded-2xl bg-white border border-border p-8 sm:p-12 text-center shadow-sm">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-accent mb-3">
            Newsletter
          </p>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-ink mb-3 max-w-sm mx-auto"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Ideas worth reading, every week.
          </h2>
          <p className="text-[14px] text-muted mb-8 max-w-xs mx-auto leading-relaxed">
            No noise. Just the best deep dives delivered to your inbox.
          </p>
          <NewsletterForm />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-8">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Apex<span className="text-accent">Byte</span>
          </span>
          <nav className="flex flex-wrap justify-center gap-5 text-[12px] text-muted">
            {["Archive", "Newsletter", "Twitter", "RSS"].map((l) => (
              <a key={l} href="#" className="hover:text-ink transition-colors">
                {l}
              </a>
            ))}
            <a
              href="https://www.apexbyte.co/#about"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              About Us
            </a>
          </nav>
          <p className="text-[12px] text-muted">© 2026 ApexByte</p>
        </div>
      </footer>
    </div>
  );
}
