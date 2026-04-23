import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/posts";
import PostsTable from "@/components/admin/PostsTable";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin();

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="px-6 sm:px-10 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-ink">Posts</h1>
          <p className="text-[13px] text-muted mt-0.5">
            {published} published · {drafts} draft
          </p>
        </div>
        <Link
          href="/admin/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-5 py-2 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New post
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total", value: posts.length },
          { label: "Published", value: published },
          { label: "Drafts", value: drafts },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white border border-border px-5 py-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-1">
              {stat.label}
            </p>
            <p className="text-[28px] font-semibold text-ink leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-border px-5 sm:px-6 py-2">
        <PostsTable posts={posts} />
      </div>
    </div>
  );
}
