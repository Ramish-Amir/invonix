/**
 * Upload a file to R2 storage
 * For files larger than 4MB, uses direct upload with presigned URL to bypass Vercel's 4.5MB limit
 * For smaller files, uses the standard API endpoint
 */
export async function uploadFileToR2(
  file: File,
  companyId: string,
  projectId: string
): Promise<{ fileUrl: string; fileSize: number }> {
  const fileSize = file.size;
  let fileUrl: string;

  // For files larger than 4MB, use direct upload with presigned URL
  // This bypasses Vercel's 4.5MB serverless function limit
  if (file.size > 4 * 1024 * 1024) {
    // Get presigned URL
    const urlResponse = await fetch("/api/get-upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        companyId,
        projectId,
      }),
    });

    if (!urlResponse.ok) {
      let errorData: any = {};
      try {
        errorData = await urlResponse.json();
      } catch (e) {
        const text = await urlResponse.text().catch(() => "");
        errorData = { error: text || "Unknown error" };
      }
      throw new Error(
        errorData.error || errorData.message || "Failed to get upload URL"
      );
    }

    const { presignedUrl, publicUrl } = await urlResponse.json();
    fileUrl = publicUrl;

    // Upload directly to R2 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Failed to upload file to R2: ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    }
  } else {
    // For smaller files, use the existing endpoint
    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", companyId);
    formData.append("projectId", projectId);

    const uploadResponse = await fetch("/api/upload-file", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      let errorData: any = {};
      try {
        errorData = await uploadResponse.json();
      } catch (e) {
        const text = await uploadResponse.text().catch(() => "");
        errorData = { error: text || "Unknown error" };
      }

      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to upload file to cloud storage"
      );
    }

    const result = await uploadResponse.json();
    fileUrl = result.fileUrl;
  }

  return { fileUrl, fileSize };
}
