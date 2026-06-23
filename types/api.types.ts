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
  error?: string;
}
