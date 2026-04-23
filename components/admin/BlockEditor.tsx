"use client";

import { useState } from "react";
import type { ContentBlock } from "@/lib/posts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function blockLabel(block: ContentBlock): string {
  switch (block.type) {
    case "heading": return `H${block.level}`;
    case "paragraph": return "¶ Text";
    case "code": return `<> ${block.language || "code"}`;
    case "callout": return `⚡ ${block.variant}`;
    case "image": return "🖼 Image";
    case "list": return block.ordered ? "1. List" : "• List";
    case "chart": return `📊 ${block.chartType}`;
  }
}

function blockSummary(block: ContentBlock): string {
  switch (block.type) {
    case "heading":   return block.text ?? "";
    case "paragraph": return (block.html ?? "").replace(/<[^>]+>/g, "").slice(0, 90);
    case "code":      return (block.code ?? "").split("\n")[0].slice(0, 90);
    case "callout":   return (block.text ?? "").slice(0, 90);
    case "image":     return block.alt || block.url || "(no alt)";
    case "list":      return (block.items ?? []).slice(0, 3).join(" · ").slice(0, 90);
    case "chart":     return block.title ?? "";
  }
}

const TYPE_BADGE: Record<string, string> = {
  heading:   "bg-purple-100 text-purple-700",
  paragraph: "bg-blue-50   text-blue-700",
  code:      "bg-zinc-100  text-zinc-700",
  callout:   "bg-yellow-50 text-yellow-700",
  image:     "bg-green-50  text-green-700",
  list:      "bg-orange-50 text-orange-700",
  chart:     "bg-cyan-50   text-cyan-700",
};

function makeDefault(type: ContentBlock["type"]): ContentBlock {
  switch (type) {
    case "heading":   return { type: "heading",   level: 2, text: "New heading" };
    case "paragraph": return { type: "paragraph", html: "New paragraph." };
    case "code":      return { type: "code",       language: "typescript", code: "// your code here" };
    case "callout":   return { type: "callout",    variant: "info", text: "Callout text." };
    case "image":     return { type: "image",      url: "", alt: "", caption: "" };
    case "list":      return { type: "list",       ordered: false, items: ["Item 1", "Item 2"] };
    case "chart":     return {
      type: "chart", chartType: "bar", title: "Chart title",
      xKey: "name", yKey: "value",
      data: [{ name: "A", value: 10 }, { name: "B", value: 20 }, { name: "C", value: 30 }],
    };
  }
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition";

// ── Block field editors ───────────────────────────────────────────────────────

function HeadingEditor({
  block, update,
}: { block: Extract<ContentBlock, { type: "heading" }>; update: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {([2, 3] as const).map((l) => (
          <button
            key={l}
            onClick={() => update({ ...block, level: l })}
            className={`px-3 py-1 rounded-lg text-[13px] font-semibold border transition ${block.level === l ? "bg-accent text-white border-accent" : "border-border text-muted bg-white hover:border-accent"}`}
          >
            H{l}
          </button>
        ))}
      </div>
      <input
        value={block.text}
        onChange={(e) => update({ ...block, text: e.target.value })}
        className={inputCls}
        placeholder="Heading text"
      />
    </div>
  );
}

function ParagraphEditor({
  block, update,
}: { block: Extract<ContentBlock, { type: "paragraph" }>; update: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted">Inline HTML only: &lt;strong&gt;, &lt;em&gt;, &lt;code&gt;, &lt;a href="…"&gt;</p>
      <textarea
        value={block.html}
        onChange={(e) => update({ ...block, html: e.target.value })}
        rows={4}
        className={`${inputCls} resize-y font-mono text-[12px]`}
      />
    </div>
  );
}

function CodeEditor({
  block, update,
}: { block: Extract<ContentBlock, { type: "code" }>; update: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-2">
      <input
        value={block.language}
        onChange={(e) => update({ ...block, language: e.target.value })}
        className={inputCls}
        placeholder="Language (e.g. python, typescript, bash)"
      />
      <textarea
        value={block.code}
        onChange={(e) => update({ ...block, code: e.target.value })}
        rows={8}
        className={`${inputCls} resize-y font-mono text-[12px]`}
      />
    </div>
  );
}

function CalloutEditor({
  block, update,
}: { block: Extract<ContentBlock, { type: "callout" }>; update: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {(["info", "tip", "warning"] as const).map((v) => (
          <button
            key={v}
            onClick={() => update({ ...block, variant: v })}
            className={`px-3 py-1 rounded-lg text-[12px] font-semibold border capitalize transition ${block.variant === v ? "bg-accent text-white border-accent" : "border-border text-muted bg-white hover:border-accent"}`}
          >
            {v}
          </button>
        ))}
      </div>
      <textarea
        value={block.text}
        onChange={(e) => update({ ...block, text: e.target.value })}
        rows={3}
        className={`${inputCls} resize-y`}
      />
    </div>
  );
}

function ImageEditor({
  block, update,
}: { block: Extract<ContentBlock, { type: "image" }>; update: (b: ContentBlock) => void }) {
  return (
    <div className="space-y-2">
      <input value={block.url}     onChange={(e) => update({ ...block, url: e.target.value })}     className={inputCls} placeholder="Image URL" />
      <input value={block.alt}     onChange={(e) => update({ ...block, alt: e.target.value })}     className={inputCls} placeholder="Alt text" />
      <input value={block.caption ?? ""} onChange={(e) => update({ ...block, caption: e.target.value })} className={inputCls} placeholder="Caption (optional)" />
    </div>
  );
}

function ListEditor({
  block, update,
}: { block: Extract<ContentBlock, { type: "list" }>; update: (b: ContentBlock) => void }) {
  const items = block.items ?? [];

  function setItem(i: number, val: string) {
    const next = [...items]; next[i] = val;
    update({ ...block, items: next });
  }
  function removeItem(i: number) {
    update({ ...block, items: items.filter((_, j) => j !== i) });
  }
  function addItem() {
    update({ ...block, items: [...items, "New item"] });
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer mb-1">
        <input
          type="checkbox"
          checked={block.ordered}
          onChange={(e) => update({ ...block, ordered: e.target.checked })}
          className="w-4 h-4 rounded accent-accent"
        />
        <span className="text-[12px] text-ink">Ordered list</span>
      </label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => setItem(i, e.target.value)}
            className={inputCls}
          />
          <button
            onClick={() => removeItem(i)}
            className="shrink-0 text-muted hover:text-red-500 transition-colors text-[16px] px-1"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-[12px] font-medium text-accent hover:text-accent-hover transition-colors"
      >
        + Add item
      </button>
    </div>
  );
}

function ChartEditor({
  block, update,
}: { block: Extract<ContentBlock, { type: "chart" }>; update: (b: ContentBlock) => void }) {
  const [jsonRaw, setJsonRaw] = useState(JSON.stringify(block.data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Keys detected from the first row of data
  const detectedKeys: string[] =
    Array.isArray(block.data) && block.data.length > 0
      ? Object.keys(block.data[0] as object)
      : [];

  function handleDataChange(val: string) {
    setJsonRaw(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error("Must be an array");
      setJsonError(null);
      // Auto-fix xKey/yKey if they no longer exist in the new data
      const keys = parsed.length > 0 ? Object.keys(parsed[0] as object) : [];
      const newXKey = keys.includes(block.xKey) ? block.xKey : (keys[0] ?? block.xKey);
      const newYKey = keys.includes(block.yKey) ? block.yKey : (keys[1] ?? block.yKey);
      update({ ...block, data: parsed, xKey: newXKey, yKey: newYKey });
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {(["bar", "line", "pie"] as const).map((ct) => (
          <button
            key={ct}
            onClick={() => update({ ...block, chartType: ct })}
            className={`px-3 py-1 rounded-lg text-[12px] font-semibold border capitalize transition ${block.chartType === ct ? "bg-accent text-white border-accent" : "border-border text-muted bg-white hover:border-accent"}`}
          >
            {ct}
          </button>
        ))}
      </div>
      <input value={block.title} onChange={(e) => update({ ...block, title: e.target.value })} className={inputCls} placeholder="Chart title" />
      <div className="flex gap-2">
        <input value={block.xKey} onChange={(e) => update({ ...block, xKey: e.target.value })} className={inputCls} placeholder='xKey (e.g. "name")' />
        <input value={block.yKey} onChange={(e) => update({ ...block, yKey: e.target.value })} className={inputCls} placeholder='yKey (e.g. "value")' />
      </div>
      {detectedKeys.length > 0 && (
        <p className="text-[11px] text-muted">
          Keys in your data:{" "}
          {detectedKeys.map((k) => (
            <span key={k} className="font-mono bg-surface border border-border rounded px-1 mr-1 text-ink">{k}</span>
          ))}
          — xKey and yKey above must match exactly
        </p>
      )}
      <textarea
        value={jsonRaw}
        onChange={(e) => handleDataChange(e.target.value)}
        rows={8}
        className={`${inputCls} resize-y font-mono text-[12px] ${jsonError ? "border-red-400" : ""}`}
      />
      {jsonError && <p className="text-[11px] text-red-600">JSON error: {jsonError}</p>}
    </div>
  );
}

// ── Block row ─────────────────────────────────────────────────────────────────

function BlockRow({
  block, index, total, expanded,
  onExpand, onUpdate, onDelete, onMove,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  expanded: boolean;
  onExpand: () => void;
  onUpdate: (b: ContentBlock) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className={`rounded-xl border transition-colors ${expanded ? "border-accent/40 bg-white" : "border-border bg-white hover:border-accent/30"}`}>
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Move buttons */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="text-muted hover:text-ink disabled:opacity-20 leading-none text-[10px]"
            title="Move up"
          >▲</button>
          <button
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="text-muted hover:text-ink disabled:opacity-20 leading-none text-[10px]"
            title="Move down"
          >▼</button>
        </div>

        {/* Type badge */}
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[block.type] ?? "bg-surface text-muted"}`}>
          {blockLabel(block)}
        </span>

        {/* Summary */}
        <button
          onClick={onExpand}
          className="flex-1 text-left text-[12px] text-ink-secondary truncate hover:text-ink transition-colors"
        >
          {blockSummary(block) || <span className="text-muted italic">empty</span>}
        </button>

        {/* Actions */}
        <button
          onClick={onExpand}
          className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors ${expanded ? "border-accent text-accent" : "border-border text-muted hover:border-accent hover:text-accent"}`}
        >
          {expanded ? "Done" : "Edit"}
        </button>
        <button
          onClick={onDelete}
          className="shrink-0 text-muted hover:text-red-500 transition-colors text-[16px] px-1"
          title="Delete block"
        >×</button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-4 pt-1 border-t border-border">
          {block.type === "heading"   && <HeadingEditor   block={block} update={onUpdate} />}
          {block.type === "paragraph" && <ParagraphEditor block={block} update={onUpdate} />}
          {block.type === "code"      && <CodeEditor      block={block} update={onUpdate} />}
          {block.type === "callout"   && <CalloutEditor   block={block} update={onUpdate} />}
          {block.type === "image"     && <ImageEditor     block={block} update={onUpdate} />}
          {block.type === "list"      && <ListEditor      block={block} update={onUpdate} />}
          {block.type === "chart"     && <ChartEditor     block={block} update={onUpdate} />}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

const BLOCK_TYPES: ContentBlock["type"][] = [
  "heading", "paragraph", "code", "callout", "list", "chart", "image",
];

export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [addType, setAddType] = useState<ContentBlock["type"]>("paragraph");

  function update(i: number, block: ContentBlock) {
    const next = [...blocks]; next[i] = block; onChange(next);
  }
  function remove(i: number) {
    onChange(blocks.filter((_, j) => j !== i));
    if (expandedIndex === i) setExpandedIndex(null);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setExpandedIndex(j);
  }
  function addBlock() {
    const next = [...blocks, makeDefault(addType)];
    onChange(next);
    setExpandedIndex(next.length - 1);
  }

  return (
    <div className="space-y-2">
      {blocks.length === 0 && (
        <p className="text-[13px] text-muted italic py-4 text-center">No blocks yet. Add one below.</p>
      )}

      {blocks.map((block, i) => (
        <BlockRow
          key={i}
          block={block}
          index={i}
          total={blocks.length}
          expanded={expandedIndex === i}
          onExpand={() => setExpandedIndex(expandedIndex === i ? null : i)}
          onUpdate={(b) => update(i, b)}
          onDelete={() => remove(i)}
          onMove={(dir) => move(i, dir)}
        />
      ))}

      {/* Add block */}
      <div className="flex gap-2 pt-2">
        <select
          value={addType}
          onChange={(e) => setAddType(e.target.value as ContentBlock["type"])}
          className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={addBlock}
          className="rounded-xl border border-accent text-accent hover:bg-accent hover:text-white text-[13px] font-medium px-4 py-2 transition-colors"
        >
          + Add block
        </button>
      </div>
    </div>
  );
}
