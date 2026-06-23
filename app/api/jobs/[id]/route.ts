import { NextRequest, NextResponse } from "next/server";
import { LlamaCloud } from "@llamaindex/llama-cloud";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Wait for the route params to resolve
    const { id } = await params;
    
    const searchParams = request.nextUrl.searchParams;
    const llamaJobId = searchParams.get("llamaJobId");

    if (!llamaJobId) {
      return NextResponse.json({
        status: "PROCESSING",
        parsedText: "",
      });
    }

    const apiKey = process.env.LLAMA_CLOUD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "LlamaCloud API Key is not configured for direct polling." },
        { status: 500 },
      );
    }

    const client = new LlamaCloud({ apiKey });

    // Retrieve parse job with expanded markdown content
    const jobData = await client.parsing.get(llamaJobId, {
      expand: ["markdown_full"],
    });

    const status = jobData.job.status;
    const mappedStatus =
      status === "COMPLETED"
        ? "SUCCESS"
        : status === "FAILED" || status === "CANCELLED"
          ? "FAILED"
          : "PROCESSING";

    const parsedText = jobData.markdown_full || "";

    return NextResponse.json({
      status: mappedStatus,
      parsedContent: parsedText,
      parsedText,
      error: jobData.job.error_message || undefined,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch job status: ${errorMessage}` },
      { status: 500 },
    );
  }
}
