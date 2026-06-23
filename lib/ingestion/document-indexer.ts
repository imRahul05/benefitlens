import { prisma } from "@/lib/prisma";

import { getDocumentChunks, persistDocumentChunks } from "./chunk-persistence";
import { createVectorStoreFromChunks } from "./vector-store";

export class DocumentIndexingError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "DocumentIndexingError";
    this.statusCode = statusCode;
  }
}

export interface IndexedDocumentResult {
  documentId: string;
  chunkCount: number;
  vectorStoreId: string;
  status: "SUCCESS";
}

export async function indexDocument(
  documentId: string,
): Promise<IndexedDocumentResult> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new DocumentIndexingError("Document not found.", 404);
  }

  if (!document.markdown?.trim()) {
    throw new DocumentIndexingError("Document markdown is not available.", 400);
  }

  const chunks = await persistDocumentChunks(document.id, document.markdown);

  if (chunks.length === 0) {
    throw new DocumentIndexingError("Document markdown did not produce any chunks.", 400);
  }

  if (document.vectorStoreId) {
    return {
      documentId: document.id,
      chunkCount: chunks.length,
      vectorStoreId: document.vectorStoreId,
      status: "SUCCESS",
    };
  }

  const vectorStoreId = await createVectorStoreFromChunks({
    documentId: document.id,
    fileName: document.fileName,
    chunks,
  });

  await prisma.document.update({
    where: { id: document.id },
    data: { vectorStoreId },
  });

  return {
    documentId: document.id,
    chunkCount: chunks.length,
    vectorStoreId,
    status: "SUCCESS",
  };
}

export async function getDocumentChunkSummaries(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true },
  });

  if (!document) {
    throw new DocumentIndexingError("Document not found.", 404);
  }

  const chunks = await getDocumentChunks(documentId);

  return chunks.map((chunk) => ({
    id: chunk.id,
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    characterCount: chunk.content.length,
    createdAt: chunk.createdAt.toISOString(),
  }));
}
