import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn(),
}));

describe("uploadPhotoToR2", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      R2_ACCOUNT_ID: "test-account",
      R2_ACCESS_KEY_ID: "test-key",
      R2_SECRET_ACCESS_KEY: "test-secret",
      R2_BUCKET_NAME: "test-bucket",
      R2_PUBLIC_URL: "https://cdn.example.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns error when file is missing", async () => {
    const { uploadPhotoToR2 } = await import("@/lib/r2-client");
    const formData = new FormData();
    formData.append("orderId", "1");
    formData.append("gastoType", "combustible");

    const result = await uploadPhotoToR2(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("No file provided");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns error when orderId is missing", async () => {
    const { uploadPhotoToR2 } = await import("@/lib/r2-client");
    const formData = new FormData();
    formData.append("file", new Blob(["x"]), "test.jpg");

    const result = await uploadPhotoToR2(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("No order ID");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns error when R2 env vars are missing", async () => {
    process.env.R2_ACCOUNT_ID = "";
    process.env.R2_ACCESS_KEY_ID = "";
    process.env.R2_SECRET_ACCESS_KEY = "";
    process.env.R2_BUCKET_NAME = "";

    const { uploadPhotoToR2 } = await import("@/lib/r2-client");
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "image/jpeg" }), "test.jpg");
    formData.append("orderId", "1");

    const result = await uploadPhotoToR2(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("environment variables");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns error for disallowed file type", async () => {
    const { uploadPhotoToR2 } = await import("@/lib/r2-client");
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["x"], { type: "application/pdf" }),
      "doc.pdf"
    );
    formData.append("orderId", "1");

    const result = await uploadPhotoToR2(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("not allowed");
    expect(result.error).toContain("JPEG");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("uploads successfully for valid image", async () => {
    const { uploadPhotoToR2 } = await import("@/lib/r2-client");
    const blob = new Blob(["image-data"], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");
    formData.append("orderId", "123");
    formData.append("gastoType", "combustible");

    const result = await uploadPhotoToR2(formData);
    expect(result.success).toBe(true);
    expect(result.url).toMatch(/^https:\/\/cdn\.example\.com\/work-orders\/123\//);
    expect(result.url).toContain("combustible");
    expect(result.fileName).toBe("photo.jpg");
    expect(result.mimeType).toBe("image/jpeg");
    expect(mockSend).toHaveBeenCalled();
  });
});
