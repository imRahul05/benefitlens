import type { Chunk } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { chunkMarkdown } from "./chunker";

export async function persistDocumentChunks(
  documentId: string,
  markdown: string,
): Promise<Chunk[]> {
  const existingChunks = await getDocumentChunks(documentId);
  if (existingChunks.length > 0) {
    return existingChunks;
  }

  const generatedChunks = chunkMarkdown(markdown);
  if (generatedChunks.length === 0) {
    return [];
  }

  await prisma.chunk.createMany({
    data: generatedChunks.map((chunk) => ({
      documentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
    })),
    skipDuplicates: true,
  });

  return getDocumentChunks(documentId);
}

export function getDocumentChunks(documentId: string): Promise<Chunk[]> {
  return prisma.chunk.findMany({
    where: { documentId },
    orderBy: { chunkIndex: "asc" },
  });
}
