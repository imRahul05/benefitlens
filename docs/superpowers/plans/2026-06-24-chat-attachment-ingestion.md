# Chat Attachment Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users attach a file/photo in chat, press send, and automatically parse, index, and ask against that document.

**Architecture:** Keep the existing server APIs. The client orchestrates upload, parse polling, indexing, and chat submission from `ChatPanel`, while `PromptInput` preserves the original browser `File` object for attached files.

**Tech Stack:** Next.js 16, React 19, TanStack Query, AI SDK `FileUIPart`, LlamaCloud parse API, OpenAI vector store RAG.

## Global Constraints

- Attachment processing waits until the user presses send.
- Only the first attachment is used for the first version.
- The backend chat endpoint remains single-document RAG.
- No new database schema is required.
- Existing text-only selected-document chat behavior must remain unchanged.

---

### Task 1: Preserve Browser Files in PromptInput

**Files:**
- Modify: `components/ai-elements/prompt-input.tsx`

**Interfaces:**
- Produces: `PromptInputFilePart = FileUIPart & { file?: File }`
- Produces: `PromptInputMessage.files: PromptInputFilePart[]`
- Consumed by: `components/chat/chat-panel.tsx`

- [ ] **Step 1: Add a prompt-input file type**

Add near the AI SDK imports:

```ts
export type PromptInputFilePart = FileUIPart & {
  file?: File;
};
```

- [ ] **Step 2: Store original files when adding attachments**

When constructing attachment items from browser `File` instances, include `file`.

```ts
next.push({
  file,
  filename: file.name,
  id: nanoid(),
  mediaType: file.type,
  type: "file",
  url: URL.createObjectURL(file),
});
```

Apply the same shape in provider attachment state if it constructs `FileUIPart` objects.

- [ ] **Step 3: Preserve `file` on submit**

In the submit conversion block, strip only `id` from each item and keep `file`:

```ts
const { id, ...item } = file;
void id;
```

Update `PromptInputMessage`:

```ts
export interface PromptInputMessage {
  text: string;
  files: PromptInputFilePart[];
}
```

- [ ] **Step 4: Run verification**

Run: `pnpm lint`

Expected: no ESLint errors.

---

### Task 2: Pass Full PromptInputMessage from ChatInput

**Files:**
- Modify: `components/chat/chat-input.tsx`

**Interfaces:**
- Consumes: `PromptInputMessage`
- Produces: `onSubmit: (message: PromptInputMessage) => void`

- [ ] **Step 1: Change props**

```ts
interface ChatInputProps {
  value: string;
  status: ChatStatus;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
}
```

- [ ] **Step 2: Submit full message**

```ts
const handleSubmit = (message: PromptInputMessage) => {
  if (!message.text.trim() || disabled) {
    return;
  }

  onSubmit(message);
};
```

- [ ] **Step 3: Keep submit disabled on empty text**

Keep:

```tsx
<PromptInputSubmit
  status={status}
  disabled={disabled || !value.trim()}
  className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
/>
```

- [ ] **Step 4: Run verification**

Run: `pnpm lint`

Expected: no ESLint errors.

---

### Task 3: Orchestrate Upload, Parse, Index, and Chat

**Files:**
- Modify: `components/chat/chat-panel.tsx`

**Interfaces:**
- Consumes: `PromptInputMessage`
- Consumes: `uploadDocument(file)`, `waitForCompletion(jobId, llamaJobId, onProgress)`, `indexDocument(jobId)`
- Produces prop: `onDocumentReady?: (documentId: string) => void`

- [ ] **Step 1: Import parsing helpers and PromptInputMessage**

```ts
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  indexDocument,
  uploadDocument,
  waitForCompletion,
} from "@/lib/api/parsing.api";
```

- [ ] **Step 2: Add ingestion status state**

```ts
type IngestionStage = "uploading" | "parsing" | "indexing" | null;

const [ingestionStage, setIngestionStage] = useState<IngestionStage>(null);
```

- [ ] **Step 3: Add file extraction helper**

```ts
async function promptFileToBrowserFile(filePart: PromptInputMessage["files"][number]) {
  if (filePart.file) {
    return filePart.file;
  }

  const response = await fetch(filePart.url);
  const blob = await response.blob();

  return new File([blob], filePart.filename || "chat-attachment", {
    type: filePart.mediaType || blob.type,
  });
}
```

- [ ] **Step 4: Replace submit flow**

Use `handleSubmit(message: PromptInputMessage)`:

```ts
const handleSubmit = async (message: PromptInputMessage) => {
  const trimmedInput = message.text.trim();
  if (!trimmedInput || chatMutation.isPending || ingestionStage) {
    return;
  }

  const attachedFile = message.files[0];
  const targetDocumentId = attachedFile
    ? await ingestAttachedDocument(attachedFile)
    : documentId;

  if (!attachedFile && !isIndexed) {
    return;
  }

  setError(null);
  setMessages((current) => [...current, createMessage("user", trimmedInput)]);
  setInput("");
  chatMutation.mutate({ documentId: targetDocumentId, message: trimmedInput });
};
```

- [ ] **Step 5: Change mutation input**

```ts
const chatMutation = useMutation({
  mutationFn: ({
    documentId: activeDocumentId,
    message,
  }: {
    documentId: string;
    message: string;
  }) =>
    askDocumentQuestion({
      documentId: activeDocumentId,
      message,
    }),
  ...
});
```

- [ ] **Step 6: Add ingest helper**

```ts
const ingestAttachedDocument = async (
  filePart: PromptInputMessage["files"][number],
) => {
  try {
    setError(null);
    setIngestionStage("uploading");
    const browserFile = await promptFileToBrowserFile(filePart);
    const upload = await uploadDocument(browserFile);

    setIngestionStage("parsing");
    await waitForCompletion(upload.internalJobId, upload.llamaJobId);

    setIngestionStage("indexing");
    await indexDocument(upload.internalJobId);

    onDocumentReady?.(upload.internalJobId);

    return upload.internalJobId;
  } finally {
    setIngestionStage(null);
  }
};
```

- [ ] **Step 7: Show progress**

Render a compact progress line from `ingestionStage`:

```ts
const progressMessage =
  ingestionStage === "uploading"
    ? "Uploading attachment..."
    : ingestionStage === "parsing"
      ? "Parsing document..."
      : ingestionStage === "indexing"
        ? "Indexing document..."
        : chatMutation.isPending
          ? "Searching the indexed document..."
          : null;
```

- [ ] **Step 8: Disable input during ingestion**

Pass:

```tsx
disabled={!isIndexed || chatMutation.isPending || !!ingestionStage}
```

but allow attached-file sends even when no document is indexed by computing:

```tsx
disabled={chatMutation.isPending || !!ingestionStage}
```

inside `ChatInput`, while preserving text-only guard in `handleSubmit`.

- [ ] **Step 9: Run verification**

Run: `pnpm lint`

Expected: no ESLint errors.

---

### Task 4: Refresh and Select Newly Indexed Documents

**Files:**
- Modify: `app/chat/page-client.tsx`

**Interfaces:**
- Consumes: `ChatPanel onDocumentReady(documentId: string)`

- [ ] **Step 1: Add callback**

```ts
const handleDocumentReady = async (documentId: string) => {
  setSelectedDocumentId(documentId);
  await queryClient.invalidateQueries({ queryKey: ["parsedDocuments"] });
};
```

- [ ] **Step 2: Pass callback to ChatPanel**

```tsx
<ChatPanel
  key={selectedDocument.id}
  documentId={selectedDocument.id}
  fileName={selectedDocument.fileName}
  isIndexed
  className="h-[calc(100vh-140px)] min-h-[560px]"
  onDocumentReady={handleDocumentReady}
/>
```

Also pass it in any fallback ChatPanel render introduced to allow attachment-first chat.

- [ ] **Step 3: Allow chat panel when no selected document exists**

Render a `ChatPanel` with `documentId=""`, `fileName="New chat"`, and `isIndexed={false}` when there are no parsed documents. Text-only sends will remain blocked, attached-file sends will ingest first.

- [ ] **Step 4: Run final verification**

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

Expected:
- lint passes
- tests pass
- build passes
