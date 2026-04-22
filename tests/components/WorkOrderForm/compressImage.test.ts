import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LARGE_FILE_THRESHOLD } from "@/components/WorkOrderForm/compressImage";

// Mock browser-image-compression — intercepts both static and dynamic imports.
vi.mock("browser-image-compression", () => ({
  default: vi
    .fn()
    .mockResolvedValue(
      new File(["compressed"], "compressed.jpg", { type: "image/jpeg" })
    ),
}));

function makeFile(sizeBytes: number, name = "photo.jpg"): File {
  // Fill with zeros — we just need the .size property to be correct.
  const data = new Uint8Array(sizeBytes);
  return new File([data], name, { type: "image/jpeg" });
}

function noop(_msg: string) {}

describe("compressImage — LARGE_FILE_THRESHOLD constant", () => {
  it("is 5 MB", () => {
    expect(LARGE_FILE_THRESHOLD).toBe(5 * 1024 * 1024);
  });
});

describe("compressImage — large file path (> 5 MB)", () => {
  beforeEach(() => {
    vi.stubGlobal("createImageBitmap", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("does NOT call createImageBitmap", async () => {
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const largeFile = makeFile(LARGE_FILE_THRESHOLD + 1);
    await compressImage(largeFile, noop);
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it("calls browser-image-compression with useWebWorker:false", async () => {
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const imageCompression = (await import("browser-image-compression")).default;
    const largeFile = makeFile(LARGE_FILE_THRESHOLD + 1);
    await compressImage(largeFile, noop);
    expect(imageCompression).toHaveBeenCalledWith(
      largeFile,
      expect.objectContaining({ useWebWorker: false, maxWidthOrHeight: 1200 })
    );
  });

  it("logs the large-file message", async () => {
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const log = vi.fn();
    const largeFile = makeFile(LARGE_FILE_THRESHOLD + 1);
    await compressImage(largeFile, log);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("skipping createImageBitmap")
    );
  });

  it("returns the compressed blob", async () => {
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const largeFile = makeFile(LARGE_FILE_THRESHOLD + 1);
    const result = await compressImage(largeFile, noop);
    expect(result).toBeInstanceOf(Blob);
  });
});

describe("compressImage — small file path (≤ 5 MB)", () => {
  let mockBitmap: any;
  let mockCanvas: any;
  let mockCtx: any;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBitmap = { width: 800, height: 600, close: vi.fn() };
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue(mockBitmap)
    );

    mockCtx = { drawImage: vi.fn() };
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi
        .fn()
        .mockImplementation((cb: (b: Blob) => void) =>
          cb(new Blob(["canvas-output"], { type: "image/jpeg" }))
        ),
    };

    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      (tag: string, ...args: any[]) => {
        if (tag === "canvas") return mockCanvas as unknown as HTMLElement;
        return originalCreateElement(tag, ...args);
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls createImageBitmap", async () => {
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const smallFile = makeFile(1024 * 1024); // 1 MB
    await compressImage(smallFile, noop);
    expect(createImageBitmap).toHaveBeenCalledWith(
      smallFile,
      expect.objectContaining({ resizeWidth: 1200 })
    );
  });

  it("closes the bitmap after drawing", async () => {
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const smallFile = makeFile(1024 * 1024);
    await compressImage(smallFile, noop);
    expect(mockBitmap.close).toHaveBeenCalled();
  });

  it("returns a Blob", async () => {
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const smallFile = makeFile(1024 * 1024);
    const result = await compressImage(smallFile, noop);
    expect(result).toBeInstanceOf(Blob);
  });
});

describe("compressImage — small file fallback when createImageBitmap throws", () => {
  beforeEach(async () => {
    // Restore the mock implementation — vi.clearAllMocks() in prior describe
    // blocks can wipe mockResolvedValue; re-apply it before each test here.
    const mod = await import("browser-image-compression");
    vi.mocked(mod.default).mockResolvedValue(
      new File(["compressed"], "compressed.jpg", { type: "image/jpeg" }) as any
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("falls back to browser-image-compression when createImageBitmap rejects", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(new Error("OOM"))
    );
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const imageCompression = (await import("browser-image-compression")).default;
    const smallFile = makeFile(1024 * 1024);
    await compressImage(smallFile, noop);
    expect(imageCompression).toHaveBeenCalled();
  });

  it("logs the fallback message when native path fails", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(new Error("bitmap_timeout"))
    );
    const { compressImage } = await import(
      "@/components/WorkOrderForm/compressImage"
    );
    const log = vi.fn();
    const smallFile = makeFile(1024 * 1024);
    await compressImage(smallFile, log);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Native path failed")
    );
  });
});
