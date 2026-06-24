import assert from "node:assert/strict";
import test from "node:test";

import { getErrorMessage, internalServerError } from "./server-errors";

test("getErrorMessage handles Error instances and unknown thrown values", () => {
  assert.equal(getErrorMessage(new Error("database offline")), "database offline");
  assert.equal(getErrorMessage("plain failure"), "Unknown error");
});

test("internalServerError returns the standard 500 JSON response", async () => {
  const response = internalServerError("Failed to load parsed documents", new Error("timeout"));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Failed to load parsed documents: timeout",
  });
});
