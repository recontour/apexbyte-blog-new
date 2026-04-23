"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PostSummary } from "@/lib/posts";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
        status === "published"
          ? "bg-green-100 text-green-700"
          : "bg-border text-muted"
      }`}
    >
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

export default function PostsTable({ posts }: { posts: PostSummary[] }) {
  const router = useRouter();
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);

  async function handleDelete(slug: string) {
    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh();
    } catch {
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeletingSlug(null);
      setConfirmSlug(null);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[15px] text-muted mb-4">No posts yet.</p>
        <Link
          href="/admin/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-5 py-2 transition-colors"
        >
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Confirm delete overlay */}
      {confirmSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl border border-border shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-[15px] font-semibold text-ink mb-2">Delete post?</h3>
            <p className="text-[13px] text-muted mb-6">
              <span className="font-mono text-ink-secondary">{confirmSlug}</span> will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSlug(null)}
                className="flex-1 rounded-full border border-border text-[13px] font-medium text-ink py-2 hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmSlug)}
                disabled={deletingSlug === confirmSlug}
                className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium py-2 transition-colors disabled:opacity-60"
              >
                {deletingSlug === confirmSlug ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {posts.map((post) => (
          <div key={post.slug} className="flex items-start justify-between gap-4 py-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <StatusBadge status={post.status} />
                {post.featured && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-accent/10 text-accent">
                    Featured
                  </span>
                )}
                <span className="text-[11px] text-muted">{post.category}</span>
              </div>
              <p className="text-[14px] font-medium text-ink truncate">{post.title}</p>
              <p className="text-[12px] text-muted mt-0.5">
                {post.author.name} ·{" "}
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {post.readTime}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {post.status === "published" && (
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="text-[12px] font-medium text-muted hover:text-ink transition-colors"
                >
                  View ↗
                </Link>
              )}
              <Link
                href={`/admin/${post.slug}/edit`}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-ink-secondary hover:text-ink hover:border-ink transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => setConfirmSlug(post.slug)}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-muted hover:text-red-600 hover:border-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
