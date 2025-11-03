import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Initialize S3 client for Cloudflare R2
const getR2Client = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Missing Cloudflare R2 environment variables");
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
    bucketName,
  };
};

/**
 * Upload a file to Cloudflare R2
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The original file name
 * @param companyId - The company ID
 * @param projectId - The project ID
 * @returns The public URL of the uploaded file
 */
export async function uploadFileToR2(
  fileBuffer: Buffer,
  fileName: string,
  companyId: string,
  projectId: string
): Promise<string> {
  try {
    const { client, bucketName } = getR2Client();

    // Generate a simple key for the file: companies/{companyId}/{projectId}-{filename}.pdf
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueKey = `companies/${companyId}/${projectId}-${sanitizedFileName}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      Body: fileBuffer,
      ContentType: "application/pdf",
    });

    await client.send(command);

    // Generate the public URL
    // If CLOUDFLARE_R2_PUBLIC_URL is set, use it; otherwise construct from bucket name and account ID
    let publicUrl: string;
    if (process.env.CLOUDFLARE_R2_PUBLIC_URL) {
      // Ensure the public URL ends with / if provided
      const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL.endsWith("/")
        ? process.env.CLOUDFLARE_R2_PUBLIC_URL
        : `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/`;
      publicUrl = `${baseUrl}${uniqueKey}`;
    } else {
      // Default R2 public URL format (requires public access to be configured)
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      publicUrl = `https://pub-${accountId}.r2.dev/${uniqueKey}`;
    }

    return publicUrl;
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    throw error;
  }
}

/**
 * Delete a file from Cloudflare R2
 * @param fileUrl - The URL of the file to delete
 * @returns void
 */
export async function deleteFileFromR2(fileUrl: string): Promise<void> {
  try {
    const { client, bucketName } = getR2Client();

    // Extract the key from the URL
    // URL formats:
    // - https://pub-accountId.r2.dev/companies/.../file.pdf
    // - https://custom-domain.com/companies/.../file.pdf
    // - https://bucket-name.accountId.r2.cloudflarestorage.com/companies/.../file.pdf
    const key = extractFileKeyFromUrl(fileUrl);

    if (!key) {
      throw new Error(`Invalid file URL format: ${fileUrl}`);
    }

    // Delete from R2
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error("Error deleting file from R2:", error);
    // Don't throw - allow deletion to continue even if file deletion fails
    // Log the error for debugging
    console.warn(
      "Failed to delete file from R2, continuing with project deletion:",
      error
    );
  }
}

/**
 * Extract the file key from a R2 URL
 * @param fileUrl - The R2 file URL
 * @returns The file key
 */
export function extractFileKeyFromUrl(fileUrl: string): string | null {
  try {
    const urlParts = fileUrl.split("/");
    const keyStartIndex = urlParts.findIndex((part) => part === "companies");
    if (keyStartIndex === -1) {
      return null;
    }
    return urlParts.slice(keyStartIndex).join("/");
  } catch (error) {
    console.error("Error extracting file key from URL:", error);
    return null;
  }
}
