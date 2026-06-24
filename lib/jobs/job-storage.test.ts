import assert from "node:assert/strict";
import test from "node:test";

import { JOB_STORAGE_KEY, readStoredJobs, writeStoredJobs } from "./job-storage";
import type { ParseJob } from "@/types/job.types";

function createStorage(initialValue?: string) {
  let value = initialValue ?? null;

  return {
    getItem(key: string) {
      return key === JOB_STORAGE_KEY ? value : null;
    },
    setItem(key: string, nextValue: string) {
      if (key === JOB_STORAGE_KEY) {
        value = nextValue;
      }
    },
  };
}

const job: ParseJob = {
  internalJobId: "internal-1",
  llamaJobId: "llama-1",
  fileName: "benefits.pdf",
  fileSize: 1024,
  status: "PENDING",
  createdAt: "2026-06-24T00:00:00.000Z",
  updatedAt: "2026-06-24T00:00:00.000Z",
};

test("readStoredJobs returns parsed jobs from storage", () => {
  const storage = createStorage(JSON.stringify([job]));

  assert.deepEqual(readStoredJobs(storage), [job]);
});

test("readStoredJobs returns an empty list for missing or invalid storage", () => {
  assert.deepEqual(readStoredJobs(createStorage()), []);

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(readStoredJobs(createStorage("{broken json")), []);
  } finally {
    console.error = originalConsoleError;
  }
});

test("writeStoredJobs persists jobs under the shared key", () => {
  const storage = createStorage();

  writeStoredJobs([job], storage);

  assert.deepEqual(readStoredJobs(storage), [job]);
});
