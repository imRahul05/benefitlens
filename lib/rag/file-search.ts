import OpenAI from "openai";
import type {
  ResponseFileSearchToolCall,
  ResponseOutputText,
} from "openai/resources/responses/responses";

import { prisma } from "@/lib/prisma";
import type { ChatResponse, ChatSource } from "@/types/api.types";
import { env } from "@/config/env.config";



export class RagChatError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RagChatError";
    this.statusCode = statusCode;
  }
}

function getOpenAIClient() {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

function extractChunkIndexFromFileName(fileName?: string) {
  if (!fileName) {
    return undefined;
  }

  const match = fileName.match(/\.chunk-(\d+)\.md$/);
  return match ? Number(match[1]) : undefined;
}

function extractChunkIndexFromText(text?: string) {
  if (!text) {
    return undefined;
  }

  const match = text.match(/Chunk Index:\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function collectFileSearchResults(
  output: ResponseFileSearchToolCall[],
): ResponseFileSearchToolCall.Result[] {
  return output.flatMap((item) => item.results ?? []);
}

function collectFileCitations(annotations: ResponseOutputText["annotations"]) {
  return annotations.filter((annotation) => annotation.type === "file_citation");
}

function sourceKey(source: ChatSource) {
  return `${source.chunkId}:${source.content.slice(0, 80)}`;
}

export async function askDocumentQuestion(
  documentId: string,
  message: string,
): Promise<ChatResponse> {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new RagChatError("Message is required.", 400);
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      chunks: {
        orderBy: { chunkIndex: "asc" },
      },
    },
  });

  if (!document) {
    throw new RagChatError("Document not found.", 404);
  }

  if (!document.vectorStoreId) {
    throw new RagChatError(
      "Document is not indexed yet. Index it before starting chat.",
      400,
    );
  }

  const client = getOpenAIClient();
  const model = env.OPENAI_RAG_MODEL;

  const response = await client.responses.create({
    model,
    instructions: [
      "You answer questions using only the provided file search results.",
      "If the answer is not present in the indexed document, say that the document does not contain that information.",
      "Keep answers concise, factual, and grounded in the document.",
    ].join(" "),
    input: `Document: ${document.fileName}\n\nQuestion: ${trimmedMessage}`,
    tools: [
      {
        type: "file_search",
        vector_store_ids: [document.vectorStoreId],
        max_num_results: 8,
      },
    ],
    include: ["file_search_call.results"],
  });

  const fileSearchCalls = response.output.filter(
    (item): item is ResponseFileSearchToolCall => item.type === "file_search_call",
  );
  const resultSources = collectFileSearchResults(fileSearchCalls);

  const outputTextParts = response.output
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content)
    .filter((part): part is ResponseOutputText => part.type === "output_text");

  const citationSources = outputTextParts.flatMap((part) =>
    collectFileCitations(part.annotations),
  );

  const chunkByIndex = new Map(
    document.chunks.map((chunk) => [chunk.chunkIndex, chunk]),
  );

  const sources: ChatSource[] = [];

  for (const result of resultSources) {
    const chunkIndex =
      extractChunkIndexFromFileName(result.filename) ??
      extractChunkIndexFromText(result.text);
    const chunk = chunkIndex === undefined ? undefined : chunkByIndex.get(chunkIndex);

    const source: ChatSource = {
      chunkId: chunk?.id || result.file_id || result.filename || "unknown",
      content: result.text || chunk?.content || "",
      chunkIndex,
      fileId: result.file_id,
      fileName: result.filename,
      score: result.score,
    };

    if (source.content.trim()) {
      sources.push(source);
    }
  }

  for (const citation of citationSources) {
    const chunkIndex = extractChunkIndexFromFileName(citation.filename);
    const chunk = chunkIndex === undefined ? undefined : chunkByIndex.get(chunkIndex);
    if (!chunk) {
      continue;
    }

    sources.push({
      chunkId: chunk.id,
      content: chunk.content,
      chunkIndex,
      fileId: citation.file_id,
      fileName: citation.filename,
    });
  }

  const uniqueSources = Array.from(
    new Map(sources.map((source) => [sourceKey(source), source])).values(),
  );

  return {
    answer:
      response.output_text ||
      "The document search completed, but no answer text was returned.",
    sources: uniqueSources,
  };
}
