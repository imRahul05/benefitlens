import { NextResponse } from "next/server";

import {
  DocumentIndexingError,
  getDocumentChunkSummaries,
} from "@/lib/ingestion/document-indexer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const chunks = await getDocumentChunkSummaries(id);

    return NextResponse.json({ chunks });
  } catch (error: unknown) {
    if (error instanceof DocumentIndexingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to load document chunks: ${message}` },
      { status: 500 },
    );
  }
}
