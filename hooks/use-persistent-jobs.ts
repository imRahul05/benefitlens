"use client";

import { useCallback, useState } from "react";

import { readStoredJobs, writeStoredJobs } from "@/lib/jobs/job-storage";
import type { JobStatus, ParseJob } from "@/types/job.types";

export function usePersistentJobs() {
  const [jobs, setJobsState] = useState<ParseJob[]>(readStoredJobs);

  const setJobs: typeof setJobsState = useCallback((nextJobs) => {
    setJobsState((previousJobs) => {
      const resolvedJobs =
        typeof nextJobs === "function" ? nextJobs(previousJobs) : nextJobs;
      if (resolvedJobs !== previousJobs) {
        writeStoredJobs(resolvedJobs);
      }
      return resolvedJobs;
    });
  }, []);

  const updateJobStatus = useCallback(
    (
      internalJobId: string,
      status: JobStatus,
      parsedContent?: string,
      error?: string,
      vectorStoreId?: string | null,
    ) => {
      setJobs((prev) => {
        const index = prev.findIndex((j) => j.internalJobId === internalJobId);
        if (index === -1) return prev;
        const currentJob = prev[index];

        const textToSave = parsedContent || currentJob.parsedText || "";

        if (
          currentJob.status === status &&
          (currentJob.parsedContent === parsedContent ||
            currentJob.parsedText === textToSave) &&
          currentJob.error === error &&
          currentJob.vectorStoreId === (vectorStoreId || currentJob.vectorStoreId)
        ) {
          return prev;
        }

        const updated = [...prev];
        updated[index] = {
          ...currentJob,
          status,
          parsedContent,
          parsedText: textToSave,
          error,
          vectorStoreId: vectorStoreId || currentJob.vectorStoreId,
          updatedAt: new Date().toISOString(),
        };

        return updated;
      });
    },
    [setJobs],
  );

  return { jobs, setJobs, updateJobStatus };
}
