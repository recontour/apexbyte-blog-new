import { getAuthors } from "@/lib/posts";
import AvatarUploadCard from "@/components/admin/AvatarUploadCard";

export const dynamic = "force-dynamic";

export default async function AdminAvatarPage() {
  const authors = await getAuthors();

  return (
    <div className="px-6 sm:px-10 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold text-ink">Author Avatars</h1>
        <p className="text-[13px] text-muted mt-1">
          Upload a photo for each author. Images are automatically resized to 128×128 px WebP (~20–30 KB) and applied to all of that author&apos;s posts.
        </p>
      </div>

      {/* Author list */}
      {authors.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center">
          <p className="text-[14px] text-muted">No authors found. Publish a post first.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {authors.map((author) => (
            <AvatarUploadCard key={author.name} author={author} />
          ))}
        </div>
      )}

      {/* Tip */}
      <p className="mt-8 text-[12px] text-muted">
        Tip: Click an avatar or the &quot;Upload&quot; button to pick a photo. Any image format is accepted — JPEG, PNG, HEIC, etc.
      </p>
    </div>
  );
}
