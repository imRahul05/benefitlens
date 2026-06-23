import OpenAI, { toFile, type Uploadable } from "openai";

interface VectorStoreChunk {
  chunkIndex: number;
  content: string;
}

interface CreateVectorStoreInput {
  documentId: string;
  fileName: string;
  chunks: VectorStoreChunk[];
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function buildChunkFiles(input: CreateVectorStoreInput): Promise<Uploadable[]> {
  const safeFileName = sanitizeFileName(input.fileName);

  return Promise.all(
    input.chunks.map((chunk) => {
      const body = [
        `# ${input.fileName} - Chunk ${chunk.chunkIndex + 1}`,
        "",
        `Document ID: ${input.documentId}`,
        `Chunk Index: ${chunk.chunkIndex}`,
        "",
        chunk.content,
      ].join("\n");

      return toFile(
        Buffer.from(body, "utf-8"),
        `${safeFileName}.chunk-${chunk.chunkIndex}.md`,
        { type: "text/markdown" },
      );
    }),
  );
}

export async function createVectorStoreFromChunks(
  input: CreateVectorStoreInput,
): Promise<string> {
  if (input.chunks.length === 0) {
    throw new Error("Cannot create a vector store without chunks.");
  }

  const client = getOpenAIClient();
  const vectorStore = await client.vectorStores.create({
    name: input.fileName,
    description: `BenefitLens indexed chunks for document ${input.documentId}`,
    metadata: {
      documentId: input.documentId,
      sourceFileName: input.fileName.slice(0, 512),
      chunkCount: String(input.chunks.length),
    },
  });

  const files = await buildChunkFiles(input);
  const batch = await client.vectorStores.fileBatches.uploadAndPoll(
    vectorStore.id,
    { files },
    {
      maxConcurrency: 3,
      pollIntervalMs: 1000,
    },
  );

  if (batch.status !== "completed" || batch.file_counts.failed > 0) {
    throw new Error(
      `OpenAI vector store indexing did not complete successfully. Status: ${batch.status}; failed files: ${batch.file_counts.failed}.`,
    );
  }

  return vectorStore.id;
}
