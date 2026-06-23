import { NextRequest, NextResponse } from "next/server";
import { LlamaCloud } from "@llamaindex/llama-cloud";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Wait for the route params to resolve
    const { id } = await params;
    
    const searchParams = request.nextUrl.searchParams;
    const llamaJobId = searchParams.get("llamaJobId");

    // 1. Check if the document exists in the DB first
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (document) {
      // If the parsing already succeeded or failed, return the cached result immediately
      if (document.status === "SUCCESS" || document.status === "FAILED") {
        return NextResponse.json({
          status: document.status as "SUCCESS" | "FAILED",
          parsedContent: document.markdown || "",
          parsedText: document.markdown || "",
        });
      }
    }

    // Determine the Llama Cloud job ID. Use DB's llamaJobId first, fallback to query param.
    const activeLlamaJobId = document?.llamaJobId || llamaJobId;

    if (!activeLlamaJobId) {
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
    const jobData = await client.parsing.get(activeLlamaJobId, {
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

    // 2. If the status transitions to SUCCESS or FAILED, update the database record.
    if (mappedStatus === "SUCCESS" || mappedStatus === "FAILED") {
      if (document) {
        await prisma.document.update({
          where: { id },
          data: {
            status: mappedStatus,
            markdown: parsedText,
          },
        });
      } else {
        // Fallback: If document was not found, create/upsert it
        await prisma.document.upsert({
          where: { id },
          create: {
            id,
            fileName: searchParams.get("fileName") || "Unknown Document",
            status: mappedStatus,
            markdown: parsedText,
            llamaJobId: activeLlamaJobId,
          },
          update: {
            status: mappedStatus,
            markdown: parsedText,
          },
        });
      }
    }

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    
    // Check if document exists before deleting
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (document) {
      await prisma.document.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to delete document: ${errorMessage}` },
      { status: 500 },
    );
  }
}
