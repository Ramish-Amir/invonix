import { NextRequest, NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/services/r2StorageService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const companyId = formData.get("companyId") as string;
    const projectId = formData.get("projectId") as string;

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

    return NextResponse.json({ fileUrl });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
