"use client";

import { useState, useRef } from "react";
import { resizeToWebP, IMAGE_PRESETS } from "@/lib/image-utils";

type Props = {
  slug: string;
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
};

export default function ImageUploader({ slug, onUploaded, currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File must be under 15 MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const webpBlob = await resizeToWebP(file, IMAGE_PRESETS.cover);
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("file", webpBlob, "cover.webp");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }
      const { url } = await res.json();
      setPreview(url);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-border aspect-video bg-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(null); onUploaded(""); }}
            className="absolute top-2 right-2 rounded-full bg-black/50 text-white text-[11px] font-medium px-2.5 py-1 hover:bg-black/70 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="relative border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleInputChange}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] text-muted">Converting to WebP and uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[13px] text-ink-secondary">
                <span className="text-accent font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-muted">Any image format · auto-converted to WebP (max 1600×900)</p>
            </div>
          )}
        </div>
      )}

      {/* Re-upload button when preview exists */}
      {preview && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[12px] text-muted hover:text-ink transition-colors"
        >
          Replace image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleInputChange}
      />

      {error && (
        <p className="text-[12px] text-red-600">{error}</p>
      )}
    </div>
  );
}
