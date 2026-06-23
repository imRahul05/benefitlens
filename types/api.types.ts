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

export interface IndexDocumentResponse {
  documentId: string;
  chunkCount: number;
  vectorStoreId: string;
  status: "SUCCESS";
}
