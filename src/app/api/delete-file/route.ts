import { NextRequest, NextResponse } from "next/server";
import { deleteFileFromR2 } from "@/lib/services/r2StorageService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: "No file URL provided" },
        { status: 400 }
      );
    }

    // Delete from R2
    await deleteFileFromR2(fileUrl);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
