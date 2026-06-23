import { http } from "./http";
import type {
  DocumentChunksResponse,
  IndexDocumentResponse,
  JobStatusResponse,
  UploadResponse,
} from "../../types/api.types";
import type { JobStatus } from "../../types/job.types";

/**
 * Uploads a document to LlamaParse webhook intake proxy.
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return http.post<UploadResponse>("/api/upload", formData);
}

// Alias for backwards compatibility
export const uploadFile = uploadDocument;

/**
 * Retrieves the status of a parsing job.
 */
export async function getJobStatus(
  jobId: string,
  llamaJobId?: string,
): Promise<JobStatusResponse> {
  return http.get<JobStatusResponse>(`/api/jobs/${jobId}`, {
    params: llamaJobId ? { llamaJobId } : undefined,
  });
}

/**
 * Deletes a document ingestion record from the database.
 */
export async function deleteDocument(jobId: string): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/jobs/${jobId}`);
}

export async function indexDocument(jobId: string): Promise<IndexDocumentResponse> {
  return http.post<IndexDocumentResponse>(`/api/documents/${jobId}/index`);
}

export async function getDocumentChunks(
  jobId: string,
): Promise<DocumentChunksResponse> {
  return http.get<DocumentChunksResponse>(`/api/documents/${jobId}/chunks`);
}

/**
 * Long-polls the status of a parsing job until it completes or fails.
 * Throws a timeout error if it runs for longer than 10 minutes.
 */
export async function waitForCompletion(
  jobId: string,
  llamaJobId?: string,
  onProgress?: (status: JobStatus) => void,
): Promise<JobStatusResponse> {
  const startTime = Date.now();
  const timeoutMs = 10 * 60 * 1000; // 10 minutes
  const pollIntervalMs = 3000; // 3 seconds

  const terminalStatuses: JobStatus[] = [
    "SUCCESS",
    "ERROR",
    "CANCELLED",
    "PARTIAL_SUCCESS",
    "FAILED",
  ];

  return new Promise((resolve, reject) => {
    const poll = async () => {
      // Check for 10-minute timeout
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error("Parsing timed out after 10 minutes."));
        return;
      }

      try {
        const response = await getJobStatus(jobId, llamaJobId);

        if (onProgress) {
          onProgress(response.status);
        }

        if (terminalStatuses.includes(response.status)) {
          resolve(response);
        } else {
          setTimeout(poll, pollIntervalMs);
        }
      } catch (error) {
        console.error("Polling error, retrying in 3 seconds...", error);
        setTimeout(poll, pollIntervalMs);
      }
    };

    poll();
  });
}
