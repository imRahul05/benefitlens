import { NextResponse } from "next/server";

import { DocumentIndexingError, indexDocument } from "@/lib/ingestion/document-indexer";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await indexDocument(id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof DocumentIndexingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to index document: ${message}` },
      { status: 500 },
    );
  }
}
