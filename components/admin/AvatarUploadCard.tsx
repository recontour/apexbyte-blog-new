"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { AuthorSummary } from "@/lib/posts";

export default function AvatarUploadCard({ author }: { author: AuthorSummary }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(author.avatarUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    upload(file);
  }

  async function upload(file: File) {
    setStatus("uploading");
    setErrorMsg(null);

    const form = new FormData();
    form.append("authorName", author.name);
    form.append("file", file);

    try {
      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      // Revert preview on error
      setPreview(author.avatarUrl);
    }
  }

  const initials = author.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white border border-border px-5 py-4">
      {/* Avatar preview */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative shrink-0 group"
        title="Click to upload new photo"
      >
        {preview ? (
          <Image
            src={preview}
            alt={author.name}
            width={56}
            height={56}
            className="rounded-full object-cover w-14 h-14"
            unoptimized
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-border flex items-center justify-center text-[16px] font-semibold text-muted">
            {initials}
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M6.5 3H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2.5M13 1l4 4-7 7H6v-4l7-7Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-ink truncate">{author.name}</p>
        <p className="text-[12px] text-muted">
          {author.postCount} {author.postCount === 1 ? "post" : "posts"}
        </p>
      </div>

      {/* Status / action */}
      <div className="shrink-0">
        {status === "uploading" && (
          <span className="text-[12px] text-muted animate-pulse">Uploading…</span>
        )}
        {status === "success" && (
          <span className="text-[12px] text-green-600 font-medium">Saved ✓</span>
        )}
        {status === "error" && (
          <span className="text-[12px] text-red-500" title={errorMsg ?? undefined}>
            Failed
          </span>
        )}
        {status === "idle" && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[12px] font-medium text-accent hover:text-accent-hover transition-colors"
          >
            {preview ? "Change" : "Upload"}
          </button>
        )}
      </div>
    </div>
  );
}
