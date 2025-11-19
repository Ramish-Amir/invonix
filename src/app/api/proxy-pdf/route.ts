import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint to fetch PDF files from R2
 * This bypasses CORS issues by serving files through our own domain
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Missing file URL parameter" },
        { status: 400 }
      );
    }

    // Validate that the URL is from R2 (security check)
    if (
      !fileUrl.includes(".r2.dev") &&
      !fileUrl.includes("r2.cloudflarestorage.com")
    ) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Fetch the file from R2
    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch file from R2: ${response.status} ${response.statusText}`
      );
      console.error(`File URL: ${fileUrl}`);

      // If 401, the bucket might not have public access enabled
      if (response.status === 401) {
        return NextResponse.json(
          {
            error:
              "Unauthorized - R2 bucket may not have public access enabled. Please configure public access for your R2 bucket.",
            details: "The bucket needs to allow public reads for GET requests",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: `Failed to fetch file: ${response.status} ${response.statusText}`,
          details: `R2 returned status ${response.status}`,
        },
        { status: response.status }
      );
    }

    // Get the file data
    const fileBuffer = await response.arrayBuffer();

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="file.pdf"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error proxying PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to proxy file" },
      { status: 500 }
    );
  }
}
