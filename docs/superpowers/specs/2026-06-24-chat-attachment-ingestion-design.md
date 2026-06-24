# Chat Attachment Ingestion Design

## Goal

Allow a user to attach a file or photo in the chat prompt, press send, and chat against that uploaded document without manually visiting the ingestion or indexing flows.

## Approved Behavior

- Attachment processing waits until the user presses send.
- If the submitted message has an attachment, the first attachment is uploaded through the existing LlamaParse upload API.
- The app waits for parsing to finish, indexes the parsed document automatically, switches the active chat document to the new document, and answers the submitted question against it.
- If the submitted message has no attachment, the existing selected-document chat behavior remains unchanged.
- The first implementation supports one attached document per chat message because the current chat API accepts a single `documentId`.

## Current System

- `POST /api/upload` uploads a file to LlamaCloud and creates a local `Document` row with `PROCESSING` status.
- `GET /api/jobs/:id` polls LlamaCloud and saves parsed markdown on success.
- `POST /api/documents/:id/index` chunks parsed markdown and creates an OpenAI vector store.
- `POST /api/chat` answers a question using a single indexed `documentId`.

## Data Flow

1. User attaches a file/photo in `ChatInput`.
2. User enters a question and presses send.
3. `ChatInput` submits the full `PromptInputMessage` to `ChatPanel`.
4. `ChatPanel` adds the user message to the thread and enters an ingestion progress state.
5. The first attachment is converted into a browser `File` if needed.
6. Client calls `uploadDocument(file)`.
7. Client calls `waitForCompletion(internalJobId, llamaJobId)`.
8. Client calls `indexDocument(internalJobId)`.
9. Client refreshes parsed documents and marks the newly indexed document as active.
10. Client sends the question to `/api/chat` with the new document id.
11. Assistant answer and sources render in the existing chat thread.

## UI States

The chat panel should show a compact progress message while work is running:

- Uploading attachment...
- Parsing document...
- Indexing document...
- Searching the indexed document...

Errors should appear in the existing error area with actionable text. The prompt input should be disabled while the pipeline runs to avoid concurrent ingestion for the same panel.

## Component Changes

- `ChatInput`
  - Change `onSubmit` to receive `PromptInputMessage`.
  - Accept send when text exists. Attachments are optional context for the message.
  - Keep rendering attachment chips and the action menu.
- `PromptInput`
  - Preserve enough file metadata to reconstruct a `File` on submit. If the original browser `File` is not retained, convert submitted `data:` URLs back into `File`.
- `ChatPanel`
  - Add a submit handler that branches on whether the message includes files.
  - For attached messages, run upload, parse wait, index, and chat in sequence.
  - Keep normal selected-document chat behavior for text-only messages.
- `ChatPageClient`
  - Let `ChatPanel` notify the page when a new document is indexed so the parsed-doc list can refresh and select it.

## Constraints

- Only the first attachment is used for the first version.
- Screenshots and pasted images are treated as uploaded image files.
- The backend chat endpoint remains single-document RAG.
- No new database schema is required.

## Verification

- Lint and production build must pass.
- Existing chunking tests must pass.
- Manual path to verify:
  1. Open chat.
  2. Attach a file/photo.
  3. Type a question.
  4. Press send.
  5. Confirm progress goes through upload, parse, index, and answer.
  6. Confirm the new document appears in the parsed-doc list as indexed.
