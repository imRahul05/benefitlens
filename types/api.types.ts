import type { JobStatus } from "./job.types";

export interface UploadResponse {
  internalJobId: string;
  llamaJobId: string;
  status: JobStatus;
}

export interface JobStatusResponse {
  status: JobStatus;
  parsedContent?: string;
  parsedText?: string;
  vectorStoreId?: string | null;
  error?: string;
}

export interface DocumentChunkResponse {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  characterCount: number;
  createdAt: string;
}

export interface DocumentChunksResponse {
  chunks: DocumentChunkResponse[];
}

export interface ParsedDocumentSummary {
  id: string;
  fileName: string;
  fileSize: number | null;
  status: JobStatus;
  vectorStoreId: string | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedDocumentsResponse {
  documents: ParsedDocumentSummary[];
}

export interface IndexDocumentResponse {
  documentId: string;
  chunkCount: number;
  vectorStoreId: string;
  status: "SUCCESS";
}

export interface ChatSource {
  chunkId: string;
  content: string;
  chunkIndex?: number;
  fileId?: string;
  fileName?: string;
  score?: number;
}

export interface ChatRequest {
  documentId: string;
  message: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}
