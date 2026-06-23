export type JobStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "ERROR"
  | "CANCELLED"
  | "PARTIAL_SUCCESS";

export interface ParseJob {
  internalJobId: string;
  llamaJobId: string;
  fileName: string;
  fileSize: number;
  status: JobStatus;
  parsedText?: string;
  parsedContent?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
