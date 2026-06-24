import { NextResponse } from "next/server";

import { internalServerError } from "@/lib/api/server-errors";
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

    return internalServerError("Failed to index document", error);
  }
}
