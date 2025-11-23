import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUploadUrl } from "@/lib/services/r2StorageService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, companyId, projectId } = body;

    if (!fileName || !companyId || !projectId) {
      return NextResponse.json(
        { error: "Missing fileName, companyId, or projectId" },
        { status: 400 }
      );
    }

    // Generate presigned URL (valid for 1 hour)
    const { presignedUrl, fileKey, publicUrl } =
      await generatePresignedUploadUrl(fileName, companyId, projectId, 3600);

    return NextResponse.json({
      presignedUrl,
      fileKey,
      publicUrl,
    });
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);

    let errorMessage = "Failed to generate upload URL";
    let statusCode = 500;

    if (error.message) {
      errorMessage = error.message;
    }

    // Check for common R2 errors
    if (
      error.message?.includes("Missing Cloudflare R2 environment variables")
    ) {
      errorMessage =
        "Cloudflare R2 configuration is missing. Please contact administrator.";
      statusCode = 500;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
}

