"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";

import { usePersistentJobs } from "@/hooks/use-persistent-jobs";
import { deleteDocument, getJobStatus, indexDocument, uploadDocument } from "@/lib/api/parsing.api";
import {
  isFailedJobStatus,
  isJobStatus,
  isRunningJobStatus,
  isSuccessfulJobStatus,
  isTerminalJobStatus,
} from "@/lib/jobs/job-constant";
import { validateUploadFile } from "@/lib/uploads/file-validation";
import type { ParseJob } from "@/types/job.types";

const POLL_INTERVAL_MS = 3000;
const PARSE_TIMEOUT_MS = 10 * 60 * 1000;

export type PipelineStage = "uploading" | "parsing" | "indexing" | "failed";

export interface PipelineItem {
  id: string;
  fileName: string;
  fileSize: number;
  stage: PipelineStage;
  error?: string;
  createdAt: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

interface UseDocumentPipelineOptions {
  /** Called once a document has been parsed and indexed and is ready to chat with. */
  onDocumentReady: (documentId: string, fileName: string) => void | Promise<void>;
  /** Called when a document was parsed but automatic indexing failed. */
  onIndexFailed?: (documentId: string) => void | Promise<void>;
}

/**
 * Drives the single upload flow: upload -> LlamaParse parsing -> vector indexing.
 * In-flight jobs are persisted to localStorage so polling resumes after a reload.
 */
export function useDocumentPipeline({
  onDocumentReady,
  onIndexFailed,
}: UseDocumentPipelineOptions) {
  const { jobs, setJobs, updateJobStatus } = usePersistentJobs();
  const [indexingIds, setIndexingIds] = useState<ReadonlySet<string>>(() => new Set());
  const startedIndexing = useRef(new Set<string>());

  // Keep callbacks in refs so effects don't re-run when parents re-render.
  const onReadyRef = useRef(onDocumentReady);
  const onIndexFailedRef = useRef(onIndexFailed);
  useEffect(() => {
    onReadyRef.current = onDocumentReady;
    onIndexFailedRef.current = onIndexFailed;
  });

  const removeJob = useCallback(
    (id: string) => setJobs((prev) => prev.filter((job) => job.internalJobId !== id)),
    [setJobs],
  );

  const runIndexing = useCallback(
    async (job: ParseJob) => {
      if (startedIndexing.current.has(job.internalJobId)) {
        return;
      }
      startedIndexing.current.add(job.internalJobId);
      setIndexingIds((prev) => new Set(prev).add(job.internalJobId));

      try {
        await indexDocument(job.internalJobId);
        removeJob(job.internalJobId);
        await onReadyRef.current(job.internalJobId, job.fileName);
      } catch (error: unknown) {
        // Parsing succeeded, so the document still lives in the library and can be
        // indexed manually from the chat view.
        removeJob(job.internalJobId);
        toast.error(
          `"${job.fileName}" was parsed but indexing failed: ${getErrorMessage(error, "Indexing failed")}`,
        );
        await onIndexFailedRef.current?.(job.internalJobId);
      } finally {
        setIndexingIds((prev) => {
          const next = new Set(prev);
          next.delete(job.internalJobId);
          return next;
        });
      }
    },
    [removeJob],
  );

  // Jobs that finished parsing in an earlier session already live in the
  // server-side library; drop them from the local pipeline on load.
  useEffect(() => {
    setJobs((prev) => {
      const next = prev.filter((job) => !isSuccessfulJobStatus(job.status));
      return next.length === prev.length ? prev : next;
    });
  }, [setJobs]);

  const pollableJobs = useMemo(
    () => jobs.filter((job) => isRunningJobStatus(job.status) && !!job.llamaJobId),
    [jobs],
  );

  const pollingResults = useQueries({
    queries: pollableJobs.map((job) => ({
      queryKey: ["jobStatus", job.internalJobId, job.llamaJobId],
      queryFn: () => getJobStatus(job.internalJobId, job.llamaJobId),
      refetchInterval: (query: { state: { data?: { status?: unknown } } }) => {
        const status = query.state.data?.status;
        return isJobStatus(status) && isTerminalJobStatus(status) ? false : POLL_INTERVAL_MS;
      },
    })),
  });

  useEffect(() => {
    pollingResults.forEach((result, index) => {
      const job = pollableJobs[index];
      if (!job) return;

      if (result.isSuccess && isTerminalJobStatus(result.data.status)) {
        updateJobStatus(
          job.internalJobId,
          result.data.status,
          result.data.parsedContent || result.data.parsedText,
          result.data.error,
          result.data.vectorStoreId,
        );
        if (isFailedJobStatus(result.data.status)) {
          toast.error(`Parsing failed for "${job.fileName}"`);
        } else if (isSuccessfulJobStatus(result.data.status)) {
          void runIndexing(job);
        }
      } else if (result.isError) {
        const message = getErrorMessage(result.error, "Status check failed");
        updateJobStatus(job.internalJobId, "ERROR", undefined, message);
        toast.error(`Tracking failed for "${job.fileName}": ${message}`);
      }
    });
  }, [pollingResults, pollableJobs, updateJobStatus, runIndexing]);

  // Fail-safe: give up on jobs that have been parsing for too long.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      jobs.forEach((job) => {
        if (
          isRunningJobStatus(job.status) &&
          now - new Date(job.createdAt).getTime() > PARSE_TIMEOUT_MS
        ) {
          updateJobStatus(job.internalJobId, "ERROR", undefined, "Parsing timed out after 10 minutes.");
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [jobs, updateJobStatus]);

  const upload = useCallback(
    async (file: File) => {
      const validation = validateUploadFile(file);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }

      const tempId = crypto.randomUUID();
      const now = new Date().toISOString();
      setJobs((prev) => [
        {
          internalJobId: tempId,
          llamaJobId: "",
          fileName: file.name,
          fileSize: file.size,
          status: "PENDING",
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);

      try {
        const response = await uploadDocument(file);
        setJobs((prev) =>
          prev.map((job) =>
            job.internalJobId === tempId
              ? {
                  ...job,
                  internalJobId: response.internalJobId,
                  llamaJobId: response.llamaJobId,
                  status: response.status,
                  updatedAt: new Date().toISOString(),
                }
              : job,
          ),
        );
      } catch (error: unknown) {
        const message = getErrorMessage(error, "Upload failed");
        updateJobStatus(tempId, "ERROR", undefined, message);
        toast.error(`Upload failed: ${message}`);
      }
    },
    [setJobs, updateJobStatus],
  );

  const dismiss = useCallback(
    (id: string) => {
      removeJob(id);
      deleteDocument(id).catch(() => {
        // The record may never have reached the database (e.g. upload failed).
      });
    },
    [removeJob],
  );

  const items = useMemo<PipelineItem[]>(
    () =>
      jobs.map((job) => {
        let stage: PipelineStage;
        if (isFailedJobStatus(job.status)) {
          stage = "failed";
        } else if (isSuccessfulJobStatus(job.status) || indexingIds.has(job.internalJobId)) {
          stage = "indexing";
        } else if (!job.llamaJobId) {
          stage = "uploading";
        } else {
          stage = "parsing";
        }

        return {
          id: job.internalJobId,
          fileName: job.fileName,
          fileSize: job.fileSize,
          stage,
          error: job.error,
          createdAt: job.createdAt,
        };
      }),
    [jobs, indexingIds],
  );

  const isBusy = items.some((item) => item.stage !== "failed");

  return { items, upload, dismiss, isBusy };
}
