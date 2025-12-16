import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

interface UploadPhotoParams {
  file: File;
  workOrderId: number;
  gastoType?: string;
}

interface UploadPhotoResult {
  success: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Upload a photo to Cloudflare R2
 * @param params - Upload parameters including file, workOrderId, and optional gastoType
 * @returns Upload result with URL and metadata
 */
export async function uploadPhotoToR2({
  file,
  workOrderId,
  gastoType,
}: UploadPhotoParams): Promise<UploadPhotoResult> {
  try {
    // Validate environment variables
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      throw new Error("R2 environment variables not configured. Please check .env.local");
    }

    if (!process.env.R2_PUBLIC_URL) {
      throw new Error("R2_PUBLIC_URL environment variable not configured. Please set it in .env.local");
    }

    // Validate file type - only accept images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const fileType = file.type || 'application/octet-stream';
    
    if (!allowedTypes.includes(fileType)) {
      throw new Error(`File type ${fileType} not allowed. Only images (JPEG, PNG, GIF, WebP) and PDF files are supported.`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    
    // Determine file extension from MIME type if not in filename
    let fileExtension: string;
    if (file.name && file.name.includes('.')) {
      fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    } else {
      // Fallback to extension based on MIME type
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
      };
      fileExtension = mimeToExt[fileType] || 'jpg';
    }
    
    const fileName = `work-orders/${workOrderId}/${gastoType || "general"}-${timestamp}-${randomId}.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: fileType,
    });

    await r2Client.send(command);

    // Construct public URL - ensure R2_PUBLIC_URL doesn't have trailing slash
    const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
    const publicUrl = `${baseUrl}/${fileName}`;

    console.log(`Successfully uploaded file to R2: ${fileName}, URL: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
      fileName: file.name || fileName,
      fileSize: file.size,
      mimeType: fileType,
    };
  } catch (error: any) {
    console.error("R2 upload error:", error);
    const errorMessage = error.message || "Failed to upload file to R2";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
