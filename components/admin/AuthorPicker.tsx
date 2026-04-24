"use client";

import { useEffect, useState } from "react";
import type { AuthorSummary } from "@/lib/posts";

type Props = {
  name: string;
  avatarUrl: string;
  onChange: (name: string, avatarUrl: string) => void;
};

export default function AuthorPicker({ name, avatarUrl, onChange }: Props) {
  const [authors, setAuthors] = useState<AuthorSummary[]>([]);
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    fetch("/api/authors")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.authors)) setAuthors(d.authors);
      })
      .catch(() => {/* silently fail — author chips just won't appear */});
  }, []);

  const knownMatch = authors.find((a) => a.name === name);
  const isKnown = Boolean(knownMatch);

  function selectAuthor(author: AuthorSummary) {
    onChange(author.name, author.avatarUrl ?? "");
    setCustomMode(false);
  }

  function handleCustomClick() {
    setCustomMode(true);
    onChange("", "");
  }

  function initials(authorName: string) {
    return authorName
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <div className="space-y-3">
      {/* Known author chips */}
      {authors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {authors.map((a) => {
            const selected = a.name === name && !customMode;
            return (
              <button
                key={a.name}
                type="button"
                onClick={() => selectAuthor(a)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium border transition-colors ${
                  selected
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-white text-ink-secondary hover:border-accent hover:text-accent"
                }`}
              >
                {a.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.avatarUrl}
                    alt={a.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-border flex items-center justify-center text-[9px] font-semibold text-muted shrink-0">
                    {initials(a.name)}
                  </div>
                )}
                {a.name}
              </button>
            );
          })}

          {/* New author option */}
          <button
            type="button"
            onClick={handleCustomClick}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium border transition-colors ${
              customMode || (!isKnown && name)
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-white text-ink-secondary hover:border-accent hover:text-accent"
            }`}
          >
            + New
          </button>
        </div>
      )}

      {/* Custom / new author text input */}
      {(customMode || (!isKnown && name) || authors.length === 0) && (
        <input
          value={name}
          onChange={(e) => onChange(e.target.value, "")}
          placeholder="Author name"
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-ink placeholder-[#b5b5ba] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
        />
      )}

      {/* Avatar preview when a known author is selected */}
      {avatarUrl && (
        <div className="flex items-center gap-2 text-[12px] text-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover" />
          <span>Avatar will be shown on post</span>
        </div>
      )}

      {/* No avatar nudge for known authors without one */}
      {isKnown && !avatarUrl && (
        <p className="text-[11px] text-muted">
          No avatar yet —{" "}
          <a href="/admin/avatar" className="text-accent hover:underline" target="_blank" rel="noreferrer">
            upload one
          </a>
        </p>
      )}
    </div>
  );
}
