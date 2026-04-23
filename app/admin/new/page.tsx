"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BlockRenderer from "@/components/blog/BlockRenderer";
import ImageUploader from "@/components/admin/ImageUploader";
import type { GeneratedPost } from "@/lib/gemini";
import type { ContentBlock } from "@/lib/posts";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewPostPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<"prompt" | "edit" | "publishing">("prompt");

  // Prompt
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateStatus, setGenerateStatus] = useState("");

  // Generated + editable post data
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [readTime, setReadTime] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [coverImage, setCoverImage] = useState<string>("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Publish
  const [publishError, setPublishError] = useState<string | null>(null);

  // ── Generate ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenerateError(null);
    setGenerateStatus("Sending prompt to Gemini…");

    // Cycle status messages — generation takes 90–150s, so pace at ~20s per step
    const statuses = [
      "Sending prompt to Gemini…",
      "Gemini is writing your article…",
      "Structuring sections and headings…",
      "Building callouts and lists…",
      "Generating chart…",
      "Almost there…",
    ];
    let i = 0;
    const ticker = setInterval(() => {
      i = Math.min(i + 1, statuses.length - 1);
      setGenerateStatus(statuses[i]);
    }, 20000);

    try {
      const t0 = performance.now();
      console.log("[generate] Fetching /api/generate…");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      console.log(`[generate] Response in ${Math.round(performance.now() - t0)}ms`, res.status);
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const generated: GeneratedPost = data.post;
      setPost(generated);
      setSlug(generated.suggestedSlug);
      setTitle(generated.title);
      setExcerpt(generated.excerpt);
      setCategory(generated.category);
      setTags(generated.tags.join(", "));
      setReadTime(generated.readTime);
      setBlocks(generated.blocks);
      setStep("edit");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      clearInterval(ticker);
      setGenerating(false);
      setGenerateStatus("");
    }
  }

  // ── Publish ─────────────────────────────────────────────────────────────────

  async function handlePublish() {
    if (!post) return;
    setStep("publishing");
    setPublishError(null);

    const payload = {
      slug,
      title,
      excerpt,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author: { name: authorName, avatarUrl: "" },
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
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      router.push("/admin");
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Publish failed.");
      setStep("edit");
    }
  }

  // ── Step: Prompt ─────────────────────────────────────────────────────────────

  if (step === "prompt") {
    return (
      <div className="px-6 sm:px-10 py-8 max-w-2xl mx-auto">
        <h1 className="text-[22px] font-semibold text-ink mb-2">New post</h1>
        <p className="text-[13px] text-muted mb-8">
          Describe the article you want. Be specific — include the topic, angle, and any key points to cover.
        </p>

        <div className="space-y-4">
          <Field label="Prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
              rows={5}
              maxLength={2000}
              placeholder={`e.g. "Write a deep dive on why Rust is replacing C++ in systems programming — cover memory safety, performance benchmarks, adoption at major companies, and what it means for the industry."`}
              className={`${inputClass} resize-none`}
            />
            <p className="text-right text-[11px] text-muted">{prompt.length}/2000</p>
          </Field>

          {generateError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
              {generateError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-accent hover:bg-accent-hover text-white text-[14px] font-medium py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {generateStatus || "Generating with Gemini…"}
              </>
            ) : (
              "Generate post"
            )}
          </button>
          {generating ? (
            <p className="text-center text-[11px] text-muted">This can take 30–90 seconds — Gemini is writing a full article</p>
          ) : (
            <p className="text-center text-[11px] text-muted">⌘ + Enter to generate</p>
          )}
        </div>
      </div>
    );
  }

  // ── Step: Publishing ──────────────────────────────────────────────────────────

  if (step === "publishing") {
    return (
      <div className="px-6 sm:px-10 py-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-[15px] text-ink-secondary">Publishing post…</p>
      </div>
    );
  }

  // ── Step: Edit + Preview ──────────────────────────────────────────────────────

  return (
    <div className="px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("prompt")}
              className="text-[13px] text-muted hover:text-ink transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-[18px] font-semibold text-ink">Review & publish</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-[13px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            >
              <option value="published">Publish</option>
              <option value="draft">Save as draft</option>
            </select>
            <button
              onClick={handlePublish}
              className="rounded-full bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-5 py-2 transition-colors"
            >
              {status === "published" ? "Publish" : "Save draft"}
            </button>
          </div>
        </div>

        {publishError && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
            {publishError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          {/* ── Left: metadata ── */}
          <div className="space-y-5">
            <div className="rounded-2xl bg-white border border-border p-5 space-y-5">
              <Field label="Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Slug">
                <div className="flex items-center">
                  <span className="text-[12px] text-muted shrink-0 mr-1">/blog/</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className={inputClass}
                  />
                </div>
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
              {slug ? (
                <ImageUploader
                  slug={slug}
                  currentUrl={coverImage || null}
                  onUploaded={(url) => setCoverImage(url)}
                />
              ) : (
                <p className="text-[12px] text-muted">Enter a slug above before uploading.</p>
              )}
            </div>
          </div>

          {/* ── Right: article preview ── */}
          <div className="rounded-2xl bg-white border border-border p-6 sm:p-10 min-h-[60vh]">
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
                <p className="text-[12px] text-muted">
                  {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {readTime}
                </p>
              </div>
            </div>
            <BlockRenderer blocks={blocks} />
          </div>
        </div>
      </div>
    </div>
  );
}
