"use client";

import dynamic from "next/dynamic";
import type { ContentBlock } from "@/lib/posts";

// Lazy-load recharts — it's large and only needed when a chart block exists
const ChartBlock = dynamic(() => import("./ChartBlock"), { ssr: false });

export default function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="prose-content">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2
                key={i}
                className="font-serif text-[22px] sm:text-[26px] font-semibold text-ink mt-10 mb-4 leading-snug"
              >
                {block.text}
              </h2>
            ) : (
              <h3
                key={i}
                className="font-serif text-[18px] sm:text-[20px] font-semibold text-ink mt-8 mb-3 leading-snug"
              >
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <p
                key={i}
                className="text-[15px] sm:text-[16px] leading-[1.8] text-ink-secondary mb-5"
                // Content is Gemini-generated with inline tags only (strong, em, code, a)
                dangerouslySetInnerHTML={{ __html: block.html ?? "" }}
              />
            );

          case "code":
            return (
              <div key={i} className="my-6">
                {block.language && (
                  <div className="rounded-t-xl bg-ink px-4 py-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono font-medium text-muted uppercase tracking-wider">
                      {block.language}
                    </span>
                  </div>
                )}
                <pre
                  className={`overflow-x-auto bg-[#141414] p-5 text-[13px] leading-relaxed text-border font-mono ${
                    block.language ? "rounded-b-xl" : "rounded-xl"
                  }`}
                >
                  <code>{block.code}</code>
                </pre>
              </div>
            );

          case "callout": {
            const CALLOUT_STYLES = {
              info: {
                wrapper: "bg-blue-50 border-blue-200",
                icon: "ℹ",
                label: "text-blue-700",
                text: "text-blue-800",
              },
              warning: {
                wrapper: "bg-amber-50 border-amber-200",
                icon: "⚠",
                label: "text-amber-700",
                text: "text-amber-800",
              },
              tip: {
                wrapper: "bg-green-50 border-green-200",
                icon: "✦",
                label: "text-green-700",
                text: "text-green-800",
              },
            };
            const safeVariant = block.variant in CALLOUT_STYLES ? block.variant : "info";
            const styles = CALLOUT_STYLES[safeVariant];

            return (
              <div
                key={i}
                className={`my-6 rounded-xl border px-5 py-4 flex gap-3 ${styles.wrapper}`}
              >
                <span className={`text-[16px] shrink-0 mt-0.5 ${styles.label}`}>
                  {styles.icon}
                </span>
                <p className={`text-[14px] leading-relaxed ${styles.text}`}>
                  {block.text}
                </p>
              </div>
            );
          }

          case "image":
            return (
              <figure key={i} className="my-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt={block.alt}
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                />
                {block.caption && (
                  <figcaption className="mt-2 text-center text-[12px] text-muted">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case "list": {
            const items = block.items ?? [];
            return block.ordered ? (
              <ol
                key={i}
                className="my-5 ml-5 list-decimal space-y-2 text-[15px] leading-relaxed text-ink-secondary"
              >
                {items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul
                key={i}
                className="my-5 ml-5 list-disc space-y-2 text-[15px] leading-relaxed text-ink-secondary"
              >
                {items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          }

          case "chart":
            return <ChartBlock key={i} block={block} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
