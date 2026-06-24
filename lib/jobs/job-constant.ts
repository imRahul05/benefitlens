import type { JobStatus } from "@/types/job.types";

export const TERMINAL_JOB_STATUSES = [
  "SUCCESS",
  "ERROR",
  "CANCELLED",
  "PARTIAL_SUCCESS",
  "FAILED",
] as const satisfies readonly JobStatus[];

export const RUNNING_JOB_STATUSES = [
  "PROCESSING",
  "PENDING",
] as const satisfies readonly JobStatus[];

export const SUCCESS_JOB_STATUSES = [
  "SUCCESS",
  "PARTIAL_SUCCESS",
] as const satisfies readonly JobStatus[];

export const FAILED_JOB_STATUSES = [
  "FAILED",
  "ERROR",
  "CANCELLED",
] as const satisfies readonly JobStatus[];

const JOB_STATUSES = [
  ...RUNNING_JOB_STATUSES,
  ...SUCCESS_JOB_STATUSES,
  ...FAILED_JOB_STATUSES,
] as const satisfies readonly JobStatus[];

function includesStatus(statuses: readonly JobStatus[], status: JobStatus) {
  return statuses.includes(status);
}

export function isJobStatus(status: unknown): status is JobStatus {
  return typeof status === "string" && (JOB_STATUSES as readonly string[]).includes(status);
}

export function isTerminalJobStatus(status: JobStatus) {
  return includesStatus(TERMINAL_JOB_STATUSES, status);
}

export function isRunningJobStatus(status: JobStatus) {
  return includesStatus(RUNNING_JOB_STATUSES, status);
}

export function isSuccessfulJobStatus(status: JobStatus) {
  return includesStatus(SUCCESS_JOB_STATUSES, status);
}

export function isFailedJobStatus(status: JobStatus) {
  return includesStatus(FAILED_JOB_STATUSES, status);
}
