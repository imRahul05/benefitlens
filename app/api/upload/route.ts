import { NextRequest, NextResponse } from "next/server";
import { LlamaCloud } from "@llamaindex/llama-cloud";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file was uploaded" },
        { status: 400 },
      );
    }

    const apiKey = process.env.LLAMA_CLOUD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "LlamaCloud API Key is not configured in environment variables." },
        { status: 500 },
      );
    }

    const internalJobId = crypto.randomUUID();

    const client = new LlamaCloud({ apiKey });

    // 1. Upload file using client.files.create
    const fileObj = await client.files.create({
      file: file,
      purpose: "parse",
    });

    if (!fileObj.id) {
      return NextResponse.json(
        { error: "LlamaCloud file upload did not return a valid file ID." },
        { status: 500 },
      );
    }

    // 2. Trigger parse job using client.parsing.create
    const parseJob = await client.parsing.create({
      file_id: fileObj.id,
      tier: "fast",
      version: "latest",
    });

    if (!parseJob.id) {
      return NextResponse.json(
        { error: "LlamaCloud parsing trigger did not return a valid job ID." },
        { status: 500 },
      );
    }

    // 3. Save initial document metadata and ingestion job to the database
    await prisma.document.create({
      data: {
        id: internalJobId,
        fileName: file.name,
        fileSize: file.size,
        llamaJobId: parseJob.id,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({
      internalJobId,
      llamaJobId: parseJob.id,
      status: "PROCESSING",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to upload file: ${errorMessage}` },
      { status: 500 },
    );
  }
}
