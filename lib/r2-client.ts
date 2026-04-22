"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

interface UploadPhotoParams {
  file: File;
  workOrderId: number;
  gastoType?: string;
}

/**
 * Result object for an R2 photo upload attempt.
 */
interface UploadPhotoResult {
  /** Whether the upload was successful. */
  success: boolean;
  /** The public-facing URL of the uploaded photo. */
  url?: string;
  /** The final storage path/filename in the bucket. */
  fileName?: string;
  /** The size of the file in bytes. */
  fileSize?: number;
  /** The MIME type of the file. */
  mimeType?: string;
  /** Error message if success is false. */
  error?: string;
}

/**
 * Handles the low-level upload process to Cloudflare R2 storage using the AWS S3 SDK.
 * 
 * Process:
 * 1. Extracts the file and metadata from the FormData object.
 * 2. Validates environment configuration (Account ID, Keys, Bucket, Public URL).
 * 3. Validates that the file is an allowed image type (JPEG, PNG, GIF, WebP).
 * 4. Generates a unique, structured filename: work-orders/{id}/{type}-{timestamp}-{random}.ext
 * 5. Uses PutObjectCommand to send the file buffer to R2.
 * 6. Constructs and returns the public access URL.
 * 
 * @param formData - Multi-part form data containing 'file', 'orderId', and 'gastoType'.
 * @returns An UploadPhotoResult object containing the URL and metadata on success.
 * @throws Error if configuration is missing, validation fails, or network error occurs.
 */
function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

/**
 * Deletes one or more photos from R2 given their public URLs.
 * Derives the R2 object key from the URL path.
 * Errors are logged but do not throw — deletion is best-effort.
 */
export async function deleteReceiptsFromR2(urls: string[]): Promise<void> {
  if (!urls.length) return;

  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    console.error("R2_BUCKET_NAME not configured — skipping R2 deletion");
    return;
  }

  const r2Client = getR2Client();

  await Promise.all(
    urls.map(async (url) => {
      try {
        // Derive the R2 key from the URL path (strip leading slash)
        const key = new URL(url).pathname.slice(1);
        await r2Client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key })
        );
        console.log(`Deleted from R2: ${key}`);
      } catch (err) {
        console.error(`Failed to delete R2 object for URL ${url}:`, err);
      }
    })
  );
}

export async function uploadPhotoToR2(
  formData: FormData
): Promise<UploadPhotoResult> {
  try {
    // 1. Extract values from FormData
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;
    const gastoType = (formData.get("gastoType") as string) || "general";

    if (!file) throw new Error("No file provided");
    if (!orderId) throw new Error("No order ID provided");

    // Validate environment variables
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME
    ) {
      throw new Error(
        "R2 environment variables not configured. Please check .env.local"
      );
    }

    if (!process.env.R2_PUBLIC_URL) {
      throw new Error(
        "R2_PUBLIC_URL environment variable not configured. Please set it in .env.local"
      );
    }

    // Validate file type - only accept images
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const fileType = file.type || "application/octet-stream";

    if (!allowedTypes.includes(fileType)) {
      throw new Error(
        `File type ${fileType} not allowed. Only images (JPEG, PNG, GIF, WebP) are supported.`
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);

    // Determine file extension based on MIME type (prioritize MIME type over filename extension)
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };

    // Always use MIME type to determine extension for accuracy
    let fileExtension = mimeToExt[fileType] || "jpg";

    // If MIME type not recognized and filename has extension, use that as fallback
    if (fileExtension === "jpg" && file.name && file.name.includes(".")) {
      const fileNameExt = file.name.split(".").pop()?.toLowerCase();
      if (
        fileNameExt &&
        ["jpg", "jpeg", "png", "gif", "webp"].includes(fileNameExt)
      ) {
        fileExtension = fileNameExt;
      }
    }

    const fileName = `work-orders/${orderId}/${gastoType || "general"}-${timestamp}-${randomId}.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const r2Client = getR2Client();
    await r2Client.send(
      new PutObjectCommand({
        // const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: fileType,
      })
    );

    // Construct public URL - clean up R2_PUBLIC_URL (remove leading colons, trailing slashes)
    let baseUrl = process.env.R2_PUBLIC_URL.trim();
    // Remove leading colons (common typo: ":https://...")
    baseUrl = baseUrl.replace(/^:+/g, "");
    // Remove trailing slashes
    baseUrl = baseUrl.replace(/\/+$/, "");
    // Ensure it starts with http:// or https://
    if (!baseUrl.match(/^https?:\/\//)) {
      throw new Error(
        `Invalid R2_PUBLIC_URL format. Must start with http:// or https://. Got: ${process.env.R2_PUBLIC_URL}`
      );
    }
    const publicUrl = `${baseUrl}/${fileName}`;

    console.log(
      `Successfully uploaded file to R2: ${fileName}, URL: ${publicUrl}`
    );

    return {
      success: true,
      url: publicUrl,
      fileName: file.name || fileName,
      fileSize: file.size,
      mimeType: fileType,
    };
  } catch (error: any) {
    console.error("R2 upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload file to R2",
    };
  }
}
