import { NextRequest, NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/services/r2StorageService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const companyId = formData.get("companyId") as string;
    const projectId = formData.get("projectId") as string;
    const fileSize = formData.get("fileSize") as string; // File size passed from client

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!companyId || !projectId) {
      return NextResponse.json(
        { error: "Missing companyId or projectId" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const fileUrl = await uploadFileToR2(
      buffer,
      file.name,
      companyId,
      projectId
    );

    return NextResponse.json({
      fileUrl,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);

    // Provide more detailed error information
    let errorMessage = "Failed to upload file to cloud storage";
    let statusCode = 500;

    if (error.message) {
      errorMessage = error.message;
    } else if (error.name) {
      errorMessage = `${error.name}: ${error.message || "Unknown error"}`;
    }

    // Check for common R2 errors
    if (
      error.message?.includes("Missing Cloudflare R2 environment variables")
    ) {
      errorMessage =
        "Cloudflare R2 configuration is missing. Please contact administrator.";
      statusCode = 500;
    } else if (
      error.Code === "InvalidAccessKeyId" ||
      error.Code === "SignatureDoesNotMatch"
    ) {
      errorMessage =
        "Invalid Cloudflare R2 credentials. Please contact administrator.";
      statusCode = 500;
    } else if (error.Code === "NoSuchBucket") {
      errorMessage =
        "Cloudflare R2 bucket not found. Please contact administrator.";
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
