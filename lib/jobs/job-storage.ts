import type { ParseJob } from "@/types/job.types";

export const JOB_STORAGE_KEY = "benefitlens-jobs";

type JobStorage = Pick<Storage, "getItem" | "setItem">;

function getBrowserStorage(): JobStorage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function readStoredJobs(storage: JobStorage | undefined = getBrowserStorage()) {
  if (!storage) {
    return [];
  }

  try {
    const stored = storage.getItem(JOB_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ParseJob[]) : [];
  } catch (error) {
    console.error("Failed to parse stored jobs", error);
    return [];
  }
}

export function writeStoredJobs(
  jobs: ParseJob[],
  storage: JobStorage | undefined = getBrowserStorage(),
) {
  storage?.setItem(JOB_STORAGE_KEY, JSON.stringify(jobs));
}
