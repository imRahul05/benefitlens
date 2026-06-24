import assert from "node:assert/strict";
import test from "node:test";

import {
  getFileExtension,
  SUPPORTED_UPLOAD_ACCEPT,
  validateUploadFile,
} from "./file-validation";

test("getFileExtension returns a normalized extension", () => {
  assert.equal(getFileExtension("benefits.PDF"), ".pdf");
  assert.equal(getFileExtension("archive"), "");
});

test("validateUploadFile accepts supported files within the size limit", () => {
  assert.deepEqual(
    validateUploadFile({ name: "scan.jpeg", size: 1024 }),
    { valid: true },
  );
  assert.equal(SUPPORTED_UPLOAD_ACCEPT, ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp");
});

test("validateUploadFile rejects unsupported files and oversized files", () => {
  assert.deepEqual(
    validateUploadFile({ name: "sheet.xlsx", size: 1024 }),
    {
      valid: false,
      reason: "unsupported-type",
      message:
        "Invalid file type! Supported formats: PDF, DOCX, TXT, and Images (PNG, JPG, WEBP).",
    },
  );

  assert.deepEqual(
    validateUploadFile({ name: "benefits.pdf", size: 10 * 1024 * 1024 + 1 }),
    {
      valid: false,
      reason: "too-large",
      message: "File is too large! Maximum limit is 10MB.",
    },
  );
});
