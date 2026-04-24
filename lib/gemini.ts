import { GoogleGenAI, Type } from "@google/genai";
import type { ContentBlock, Post } from "./posts";

// ── Types ────────────────────────────────────────────────────────────────────

// author is not AI-generated — set manually in the admin form
export type GeneratedPost = Omit<Post, "slug" | "publishedAt" | "updatedAt" | "status" | "featured" | "coverImage" | "author"> & {
  suggestedSlug: string;
};

// ── Gemini client (server-only) ──────────────────────────────────────────────

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set.");
  return new GoogleGenAI({ apiKey });
}

const MODEL = "gemini-3-flash-preview";

// ── Schema 1: article blocks (no chart, no author) ───────────────────────────

const ARTICLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title:         { type: Type.STRING },
    suggestedSlug: { type: Type.STRING },
    excerpt:       { type: Type.STRING },
    category:      { type: Type.STRING },
    tags:          { type: Type.ARRAY, items: { type: Type.STRING } },
    readTime:      { type: Type.STRING },
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type:     { type: Type.STRING, enum: ["heading", "paragraph", "callout", "list"] },
          level:    { type: Type.NUMBER },
          text:     { type: Type.STRING },
          html:     { type: Type.STRING },
          variant:  { type: Type.STRING, enum: ["info", "warning", "tip"] },
          ordered:  { type: Type.BOOLEAN },
          items:    { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["type"],
      },
    },
  },
  required: ["title", "suggestedSlug", "excerpt", "category", "tags", "readTime", "blocks"],
};

// ── Schema 2: chart only ─────────────────────────────────────────────────────

const CHART_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    chartType: { type: Type.STRING, enum: ["bar", "line", "pie"] },
    title:     { type: Type.STRING },
    xKey:      { type: Type.STRING },
    yKey:      { type: Type.STRING },
    data: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name:  { type: Type.STRING },
          value: { type: Type.NUMBER },
        },
      },
    },
  },
  required: ["chartType", "title", "xKey", "yKey", "data"],
};

// ── System prompts ────────────────────────────────────────────────────────────

const ARTICLE_SYSTEM_PROMPT = `You are a senior tech journalist writing for ApexByte, a high-quality technology publication. Your articles are analytical, precise, and written for software engineers and technical professionals.

## Length — HARD LIMITS (most important rule)
- Total article body: 600–800 words. DO NOT exceed 800 words under any circumstances.
- Maximum blocks in the array: 20. Stop writing new blocks once you reach 20.
- Each paragraph: 2–4 sentences only. No long paragraphs.
- Lists: 3–5 items maximum.

## Metadata Rules
- suggestedSlug: lowercase, hyphen-separated, max 60 chars, no special characters.
- readTime: "X min read" (estimate at 200wpm).
- tags: 3–5 relevant lowercase tags.
- category must be exactly one of: "AI & Machine Learning", "Web Development", "Security", "Cloud & DevOps", "Hardware", "Open Source", "Startups", "Deep Dives".

## Block Format — CRITICAL RULES

Each object in the "blocks" array MUST follow EXACTLY these structures:

HEADING — for section titles:
  { "type": "heading", "level": 2, "text": "Major Section Title" }
  { "type": "heading", "level": 3, "text": "Subsection Title" }
  ↳ level MUST be the integer 2 (H2, major section) or 3 (H3, subsection). NO other values.
  ↳ text is plain text only — NO HTML tags.

PARAGRAPH — for all body text:
  { "type": "paragraph", "html": "Body text with <strong>bold</strong>, <em>italic</em>, <code>inline code</code>, or <a href=\"https://example.com\">links</a>." }
  ↳ ALWAYS use the "html" field — NEVER put paragraph content in "text".
  ↳ Allowed inline HTML ONLY: <strong>  <em>  <code>  <a href="…">
  ↳ FORBIDDEN tags: <p> <div> <br> <h1> <h2> <h3> <h4> <h5> <h6> and any block-level elements.
  ↳ html MUST be a non-empty string.

CALLOUT — for warnings, tips, or key insights:
  { "type": "callout", "variant": "info",    "text": "A key insight or piece of context." }
  { "type": "callout", "variant": "warning", "text": "Something that can go wrong or break." }
  { "type": "callout", "variant": "tip",     "text": "A practical pro tip for the reader." }
  ↳ variant MUST be exactly one of these three strings: "info"  "warning"  "tip"
  ↳ text is plain text — NO HTML tags.

LIST — for bullet or numbered lists:
  { "type": "list", "ordered": false, "items": ["First bullet", "Second bullet", "Third bullet"] }
  { "type": "list", "ordered": true,  "items": ["Step one", "Step two", "Step three"] }
  ↳ ordered: boolean true for numbered lists, false for bullet points.
  ↳ items: array of plain text strings, 3–5 items maximum.

## Article Structure (target ~16 blocks total)
1 hook paragraph → 3–4 H2 sections (each: 1 heading + 1–2 paragraphs) → 1 callout → 1 list → 1 closing paragraph. Stop at 20 blocks.`;


// ── Block normalizer ──────────────────────────────────────────────────────────
// Gemini may occasionally put content in the wrong field or omit required fields.
// This runs server-side after parsing to guarantee BlockRenderer never gets bad data.

function normalizeBlocks(raw: ContentBlock[]): ContentBlock[] {
  const VALID_VARIANTS = ["info", "warning", "tip"] as const;

  return (raw ?? []).flatMap((block): ContentBlock[] => {
    if (!block || typeof block !== "object") return [];
    const b = block as Record<string, unknown>;

    switch (b.type) {
      case "heading":
        return [{
          type: "heading",
          level: b.level === 3 ? 3 : 2,
          text: String(b.text ?? ""),
        }];

      case "paragraph": {
        // Gemini sometimes puts content in "text" instead of "html"
        const html =
          (typeof b.html === "string" && b.html)
            ? b.html
            : (typeof b.text === "string" && b.text ? b.text : "");
        if (!html) return []; // skip empty paragraphs
        return [{ type: "paragraph", html }];
      }

      case "callout": {
        const variant = VALID_VARIANTS.includes(b.variant as "info" | "warning" | "tip")
          ? (b.variant as "info" | "warning" | "tip")
          : "info";
        return [{
          type: "callout",
          variant,
          text: String(b.text ?? ""),
        }];
      }

      case "list":
        return [{
          type: "list",
          ordered: b.ordered === true,
          items: Array.isArray(b.items)
            ? b.items.filter((i): i is string => typeof i === "string")
            : [],
        }];

      case "chart":
        return [block]; // generated separately — already well-formed

      default:
        return [];
    }
  });
}

// ── JSON parse helper ─────────────────────────────────────────────────────────

function parseJSON<T>(raw: string, label: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error(`[gemini] ${label} raw:`, cleaned.slice(0, 1000));
    throw new Error(`Gemini ${label} response was not valid JSON.`);
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generatePost(prompt: string): Promise<GeneratedPost> {
  const ai = getClient();

  // ── Call 1: article (no chart, no author) ─────────────────────────────────
  console.log("[gemini] Call 1: article");
  const t1 = Date.now();
  const articleRes = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: ARTICLE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });
  const call1Finish = articleRes.candidates?.[0]?.finishReason;
  console.log(`[gemini] Call 1 done in ${Date.now() - t1}ms | finishReason=${call1Finish}`);
  if (call1Finish === "MAX_TOKENS") throw new Error("Article too long — hit token limit. Try a more focused prompt.");
  if (!articleRes.text) throw new Error("Gemini returned an empty article response.");
  const article = parseJSON<GeneratedPost>(articleRes.text, "article");
  // Sanitize blocks: fix missing/wrong fields before they reach the renderer
  article.blocks = normalizeBlocks(article.blocks as ContentBlock[]);

  // ── Call 2: chart ─────────────────────────────────────────────────────────
  console.log("[gemini] Call 2: chart");
  const t2 = Date.now();
  const chartRes = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: `Generate one relevant chart for a tech article titled: "${article.title}". Topic hint: ${prompt}` }] }],
    config: {
      systemInstruction: `Generate a single chart. CRITICAL: xKey MUST always be the string "name". yKey MUST always be the string "value". Every data item MUST have a "name" (string) and a "value" (number) field only.`,
      responseMimeType: "application/json",
      responseSchema: CHART_SCHEMA,
      temperature: 0.5,
      maxOutputTokens: 4096,
    },
  });
  const call2Finish = chartRes.candidates?.[0]?.finishReason;
  console.log(`[gemini] Call 2 done in ${Date.now() - t2}ms | finishReason=${call2Finish}`);

  if (chartRes.text && call2Finish !== "MAX_TOKENS") {
    try {
      type ChartPayload = { chartType: "bar" | "line" | "pie"; title: string; xKey: string; yKey: string; data: Record<string, unknown>[] };
      const chart = parseJSON<ChartPayload>(chartRes.text, "chart");
      const chartBlock: ContentBlock = { type: "chart", ...chart };
      article.blocks = [...(article.blocks as ContentBlock[]), chartBlock];
    } catch (e) {
      console.warn("[gemini] Chart skipped — parse failed:", e instanceof Error ? e.message : e);
    }
  } else if (call2Finish === "MAX_TOKENS") {
    console.warn("[gemini] Chart skipped — hit token limit");
  }

  return article;
}
