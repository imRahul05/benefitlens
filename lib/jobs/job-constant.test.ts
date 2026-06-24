import assert from "node:assert/strict";
import test from "node:test";

import {
  isFailedJobStatus,
  isJobStatus,
  isRunningJobStatus,
  isSuccessfulJobStatus,
  isTerminalJobStatus,
  TERMINAL_JOB_STATUSES,
} from "./job-constant";
import type { JobStatus } from "@/types/job.types";

const allStatuses: JobStatus[] = [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "ERROR",
  "CANCELLED",
  "PARTIAL_SUCCESS",
];

test("job status helpers classify terminal states", () => {
  assert.deepEqual(TERMINAL_JOB_STATUSES, [
    "SUCCESS",
    "ERROR",
    "CANCELLED",
    "PARTIAL_SUCCESS",
    "FAILED",
  ]);

  assert.deepEqual(allStatuses.filter(isTerminalJobStatus), [
    "SUCCESS",
    "FAILED",
    "ERROR",
    "CANCELLED",
    "PARTIAL_SUCCESS",
  ]);
});

test("job status helpers classify running, successful, and failed states", () => {
  assert.deepEqual(allStatuses.filter(isRunningJobStatus), [
    "PENDING",
    "PROCESSING",
  ]);

  assert.deepEqual(allStatuses.filter(isSuccessfulJobStatus), [
    "SUCCESS",
    "PARTIAL_SUCCESS",
  ]);

  assert.deepEqual(allStatuses.filter(isFailedJobStatus), [
    "FAILED",
    "ERROR",
    "CANCELLED",
  ]);
});

test("isJobStatus narrows unknown status values", () => {
  assert.equal(isJobStatus("SUCCESS"), true);
  assert.equal(isJobStatus("COMPLETED"), false);
  assert.equal(isJobStatus(undefined), false);
});
