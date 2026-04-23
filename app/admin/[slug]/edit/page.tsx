"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import BlockRenderer from "@/components/blog/BlockRenderer";
import BlockEditor from "@/components/admin/BlockEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import type { ContentBlock, Post } from "@/lib/posts";

const CATEGORIES = [
  "AI & Machine Learning",
  "Web Development",
  "Security",
  "Cloud & DevOps",
  "Hardware",
  "Open Source",
  "Startups",
  "Deep Dives",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold tracking-widest uppercase text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-ink placeholder-[#b5b5ba] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  // Load state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState("");
  const [readTime, setReadTime] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [coverImage, setCoverImage] = useState<string>("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Right panel tab
  const [rightTab, setRightTab] = useState<"preview" | "blocks">("preview");

  // ── Load post from Firestore ─────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${slug}`);
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error ?? "Post not found.");
          return;
        }
        const post: Post = data.post;
        setTitle(post.title);
        setExcerpt(post.excerpt);
        setCategory(post.category);
        setTags(post.tags.join(", "));
        setAuthorName(post.author.name);
        setAuthorAvatarUrl(post.author.avatarUrl ?? "");
        setReadTime(post.readTime);
        setFeatured(post.featured);
        setStatus(post.status);
        setCoverImage(post.coverImage ?? "");
        setBlocks(post.blocks);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load post.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    const payload = {
      slug,
      title,
      excerpt,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author: { name: authorName, avatarUrl: authorAvatarUrl },
      coverImage: coverImage || null,
      readTime,
      featured,
      status,
      blocks,
    };

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-muted">Loading post…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          {loadError}
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="mt-4 text-[13px] text-muted hover:text-ink transition-colors"
        >
          ← Back to posts
        </button>
      </div>
    );
  }

  // ── Edit form ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="text-[13px] text-muted hover:text-ink transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-[18px] font-semibold text-ink">Edit post</h1>
            <span className="text-[12px] font-mono text-muted bg-surface border border-border rounded-lg px-2 py-0.5">
              /blog/{slug}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-[13px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-5 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          {/* ── Left: metadata ── */}
          <div className="space-y-5">
            <div className="rounded-2xl bg-white border border-border p-5 space-y-5">
              <Field label="Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Excerpt">
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tags (comma-separated)">
                <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Author">
                <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Read time">
                <input value={readTime} onChange={(e) => setReadTime(e.target.value)} className={inputClass} />
              </Field>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="text-[13px] font-medium text-ink">Feature on homepage</span>
              </label>
            </div>

            {/* Cover image */}
            <div className="rounded-2xl bg-white border border-border p-5 space-y-3">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-muted">Cover image</p>
              <ImageUploader
                slug={slug}
                currentUrl={coverImage || null}
                onUploaded={(url) => setCoverImage(url)}
              />
            </div>
          </div>

          {/* ── Right: preview / block editor ── */}
          <div className="rounded-2xl bg-white border border-border min-h-[60vh] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {(["preview", "blocks"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={`px-5 py-3 text-[13px] font-medium capitalize transition-colors border-b-2 -mb-px ${
                    rightTab === tab
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {tab === "blocks" ? `Blocks (${blocks.length})` : "Preview"}
                </button>
              ))}
            </div>

            {/* Preview tab */}
            {rightTab === "preview" && (
            <div className="p-6 sm:p-10">
            {coverImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverImage}
                alt={title}
                className="w-full rounded-xl mb-8 object-cover max-h-64"
              />
            )}
            <p className="text-[11px] font-semibold tracking-widest uppercase text-accent mb-3">
              {category}
            </p>
            <h1 className="font-serif text-[26px] sm:text-[32px] font-semibold text-ink leading-snug mb-4">
              {title}
            </h1>
            <p className="text-[15px] text-ink-secondary leading-relaxed mb-6 max-w-xl">
              {excerpt}
            </p>
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-[12px] font-semibold text-muted">
                {authorName[0] ?? "A"}
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">{authorName}</p>
                <p className="text-[12px] text-muted">{readTime}</p>
              </div>
            </div>
            <BlockRenderer blocks={blocks} />
            </div>
            )}

            {/* Blocks editor tab */}
            {rightTab === "blocks" && (
              <div className="p-5">
                <BlockEditor blocks={blocks} onChange={setBlocks} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
