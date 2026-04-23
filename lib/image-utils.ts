/**
 * Client-side image resizing and WebP conversion using the Canvas API.
 * No server round-trip needed — runs entirely in the browser.
 */

export type ResizeTarget = {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0–1
};

export const IMAGE_PRESETS = {
  cover: { maxWidth: 1600, maxHeight: 900, quality: 0.82 },
  thumbnail: { maxWidth: 400, maxHeight: 250, quality: 0.8 },
} satisfies Record<string, ResizeTarget>;

/**
 * Resize an image File to the given dimensions and convert to WebP.
 * Returns a Blob ready for upload.
 */
export function resizeToWebP(file: File, preset: ResizeTarget): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { maxWidth, maxHeight, quality } = preset;

      // Compute dimensions preserving aspect ratio
      let { naturalWidth: w, naturalHeight: h } = img;
      const ratio = Math.min(maxWidth / w, maxHeight / h, 1); // never upscale
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));

      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob returned null"));
          resolve(blob);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}
