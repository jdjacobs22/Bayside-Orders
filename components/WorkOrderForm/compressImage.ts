/**
 * Image compression logic for receipt photo uploads.
 * Extracted as a standalone async function so it can be unit-tested independently
 * of the form component.
 *
 * Two paths:
 *  - Large files (> LARGE_FILE_THRESHOLD): go straight to browser-image-compression.
 *    createImageBitmap allocates the full decoded image synchronously at call time —
 *    before any Promise resolves — so calling it on a 64MP Samsung A53 photo (~256 MB
 *    decoded) crashes the tab before Promise.race can intervene.
 *  - Small files: try createImageBitmap with a timeout guard; fall back to
 *    browser-image-compression if it throws or hangs.
 *
 * In both fallback cases useWebWorker:false is critical — the web worker spawns a
 * second memory arena that exceeds the tab budget on low-RAM devices.
 */

/** Files larger than this skip createImageBitmap entirely. */
export const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5 MB

/**
 * Compresses an image File to ≤ 400 KB / 1200 px on the longest edge.
 *
 * @param file - The original image File from the file input.
 * @param log  - Debug log function (e.g. addDebugLog from useDebugLog).
 * @returns A compressed Blob (image/jpeg).
 * @throws If compression fails on all paths or the canvas context is unavailable.
 */
export async function compressImage(
  file: File,
  log: (msg: string) => void
): Promise<Blob> {
  if (file.size > LARGE_FILE_THRESHOLD) {
    log(
      `Large file (${(file.size / 1024 / 1024).toFixed(1)}MB) — skipping createImageBitmap, using compression fallback directly`
    );
    const imageCompression = (await import("browser-image-compression")).default;
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1200,
      useWebWorker: false,
      initialQuality: 0.75,
    });
    log(`Fallback blob: ${(compressed.size / 1024).toFixed(0)}KB`);
    return compressed;
  }

  try {
    log("Stage 1: native bitmap resize...");
    // Race against a timeout: createImageBitmap can hang indefinitely on some
    // Android browsers rather than throwing, leaving the UI locked.
    const bitmapPromise = createImageBitmap(file, {
      resizeWidth: 1200,
      resizeQuality: "medium",
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("bitmap_timeout")), 8000)
    );
    const bitmap = await Promise.race([bitmapPromise, timeoutPromise]);
    log(`Bitmap decoded: ${bitmap.width}x${bitmap.height}`);

    // Safety: clamp to ≤ 1200 px in case the browser ignored resize hints.
    const MAX_DIM = 1200;
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const targetW = Math.floor(bitmap.width * scale);
    const targetH = Math.floor(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.75)
    );
    if (!blob) throw new Error("Canvas toBlob returned null");
    log(`Native path blob: ${(blob.size / 1024).toFixed(0)}KB`);
    return blob;
  } catch (err: any) {
    log(`Native path failed (${err.message}) — using imageCompression fallback`);
    const imageCompression = (await import("browser-image-compression")).default;
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1200,
      useWebWorker: false,
      initialQuality: 0.75,
    });
    log(`Fallback blob: ${(compressed.size / 1024).toFixed(0)}KB`);
    return compressed;
  }
}
