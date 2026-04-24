import Image from "next/image";
import Link from "next/link";
import { getFeaturedPost, getPublishedPosts } from "@/lib/posts";
import MobileNav from "@/components/blog/MobileNav";

export const dynamic = "force-dynamic";

const NAV_ITEMS = ["AI", "Dev", "Security", "Cloud", "Hardware"];

const TOPICS = [
  "AI & Machine Learning",
  "Web Development",
  "Security",
  "Cloud & DevOps",
  "Hardware",
  "Open Source",
  "Startups",
  "Deep Dives",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Home() {
  // Firebase credentials are only available at runtime on Firebase App Hosting.
  // Fall back to empty data at build time; ISR will populate on first request.
  let featured: Awaited<ReturnType<typeof getFeaturedPost>> = null;
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    [featured, posts] = await Promise.all([
      getFeaturedPost(),
      getPublishedPosts(12),
    ]);
  } catch {
    // credentials unavailable at build time — ISR will handle real data
  }

  // Filter out the featured post from the list to avoid duplication
  const listPosts = featured
    ? posts.filter((p) => p.slug !== featured.slug)
    : posts;

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
            {NAV_ITEMS.map((item) => (
              <a key={item} href="#" className="hover:text-ink transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <a
            href="#"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-accent hover:bg-accent-hover transition-colors rounded-full px-4 py-1.5"
          >
            Subscribe 
          </a>

          <MobileNav />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-5 sm:px-8 pb-24">

        {/* Hero / Featured */}
        {featured && (
          <section className="mt-12 sm:mt-16">
            <div className="rounded-2xl bg-white border border-border overflow-hidden shadow-sm">
              {featured.coverImage ? (
                <div className="w-full h-52 sm:h-72 relative">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-end p-6 sm:p-10">
                    <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold tracking-widest uppercase px-3 py-1">
                      Featured
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-52 sm:h-72 bg-linear-to-br from-accent via-[#1a56db] to-[#6d28d9] flex items-end p-6 sm:p-10">
                  <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold tracking-widest uppercase px-3 py-1">
                    Featured
                  </span>
                </div>
              )}

              <div className="p-6 sm:p-10">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-accent mb-3">
                  {featured.category}
                </p>
                <h1
                  className="font-serif text-2xl sm:text-4xl font-semibold leading-snug text-ink mb-4 max-w-2xl"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {featured.title}
                </h1>
                <p className="text-[15px] leading-relaxed text-ink-secondary max-w-xl mb-6">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {featured.author.avatarUrl ? (
                      <Image
                        src={featured.author.avatarUrl}
                        alt={featured.author.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-[12px] font-semibold text-ink-secondary">
                        {featured.author.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] font-medium text-ink">
                        {featured.author.name}
                      </p>
                      <p className="text-[12px] text-muted">
                        {formatDate(featured.publishedAt)} · {featured.readTime}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="text-[13px] font-medium text-accent hover:text-accent-hover transition-colors"
                  >
                    Read article
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {!featured && posts.length === 0 && (
          <section className="mt-16 text-center py-24">
            <p className="text-[15px] text-muted">No posts yet. Check back soon.</p>
          </section>
        )}

        {/* Topics */}
        <section className="mt-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="shrink-0 text-[12px] font-semibold text-muted uppercase tracking-wider mr-1">
              Topics
            </span>
            {TOPICS.map((t) => (
              <a
                key={t}
                href="#"
                className="shrink-0 rounded-full border border-border bg-white px-3 py-1 text-[12px] font-medium text-ink-secondary hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
              >
                {t}
              </a>
            ))}
          </div>
        </section>

        {/* Latest Posts */}
        {listPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[13px] font-semibold tracking-widest uppercase text-muted mb-6">
              Latest
            </h2>

            <div className="divide-y divide-border">
              {listPosts.map((post) => (
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
        )}

        {/* Newsletter CTA */}
        <section className="mt-16 rounded-2xl bg-white border border-border p-8 sm:p-12 text-center shadow-sm">
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
          <form className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-[14px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            />
            <button
              type="submit"
              className="rounded-full bg-accent hover:bg-accent-hover transition-colors text-white text-[14px] font-medium px-6 py-2.5 whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-8">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Apex<span className="text-accent">Byte</span>
          </span>
          <nav className="flex flex-wrap justify-center gap-5 text-[12px] text-muted">
            {["About", "Archive", "Newsletter", "Twitter", "RSS"].map((l) => (
              <a key={l} href="#" className="hover:text-ink transition-colors">
                {l}
              </a>
            ))}
          </nav>
          <p className="text-[12px] text-muted">© 2026 ApexByte</p>
        </div>
      </footer>
    </div>
  );
}
