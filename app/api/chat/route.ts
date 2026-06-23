import { NextResponse } from "next/server";

import { askDocumentQuestion, RagChatError } from "@/lib/rag/file-search";
import type { ChatRequest } from "@/types/api.types";

function isChatRequest(value: unknown): value is ChatRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.documentId === "string" &&
    typeof candidate.message === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isChatRequest(body)) {
      return NextResponse.json(
        { error: "Request must include documentId and message." },
        { status: 400 },
      );
    }

    const result = await askDocumentQuestion(body.documentId, body.message);

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof RagChatError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to answer document question: ${message}` },
      { status: 500 },
    );
  }
}
