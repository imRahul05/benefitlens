import assert from "node:assert/strict";
import test from "node:test";

import { chunkMarkdown } from "./chunker";

test("chunkMarkdown returns ordered overlapping chunks", () => {
  const markdown = "a".repeat(1000) + "b".repeat(800);

  const chunks = chunkMarkdown(markdown);

  assert.equal(chunks.length, 2);
  assert.deepEqual(
    chunks.map((chunk) => chunk.chunkIndex),
    [0, 1],
  );
  assert.equal(chunks[0]?.content.length, 1000);
  assert.equal(chunks[1]?.content.length, 1000);
  assert.equal(chunks[1]?.content.startsWith("a".repeat(200)), true);
});

test("chunkMarkdown trims blank input into no chunks", () => {
  assert.deepEqual(chunkMarkdown(" \n\t "), []);
});
