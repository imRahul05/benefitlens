"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, MessageSquareText } from "lucide-react";
import type { ChatStatus } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { askDocumentQuestion } from "@/lib/api/chat.api";
import {
  indexDocument,
  uploadDocument,
  waitForCompletion,
} from "@/lib/api/parsing.api";
import type { ChatResponse } from "@/types/api.types";

import { ChatInput } from "./chat-input";
import { ChatMessage, type ChatPanelMessage } from "./chat-message";

interface ChatPanelProps {
  documentId: string;
  fileName: string;
  isIndexed: boolean;
  className?: string;
  onDocumentReady?: (documentId: string) => void | Promise<void>;
}

type IngestionStage = "uploading" | "parsing" | "indexing" | null;

function createMessage(
  role: ChatPanelMessage["role"],
  content: string,
  result?: ChatResponse,
): ChatPanelMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    sources: result?.sources,
  };
}

async function promptFileToBrowserFile(
  filePart: PromptInputMessage["files"][number],
) {
  if (filePart.file) {
    return filePart.file;
  }

  const response = await fetch(filePart.url);
  const blob = await response.blob();

  return new File([blob], filePart.filename || "chat-attachment", {
    type: filePart.mediaType || blob.type,
  });
}

export function ChatPanel({
  documentId,
  fileName,
  isIndexed,
  className,
  onDocumentReady,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ingestionStage, setIngestionStage] =
    useState<IngestionStage>(null);

  const chatMutation = useMutation({
    mutationFn: ({
      activeDocumentId,
      message,
    }: {
      activeDocumentId: string;
      message: string;
    }) =>
      askDocumentQuestion({
        documentId: activeDocumentId,
        message,
      }),
    onSuccess: (result) => {
      setMessages((current) => [
        ...current,
        createMessage("assistant", result.answer, result),
      ]);
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to generate an answer.";
      setError(message);
    },
  });

  const status = useMemo<ChatStatus>(() => {
    return chatMutation.isPending || ingestionStage ? "submitted" : "ready";
  }, [chatMutation.isPending, ingestionStage]);

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
      await onDocumentReady?.(upload.internalJobId);

      return upload.internalJobId;
    } finally {
      setIngestionStage(null);
    }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const trimmedInput = message.text.trim();
    if (!trimmedInput || chatMutation.isPending || ingestionStage) {
      return;
    }

    const attachedFile = message.files[0];

    if (!attachedFile && !isIndexed) {
      setError("Attach a file to parse and index, or select an indexed document.");
      return;
    }

    try {
      setError(null);
      setMessages((current) => [
        ...current,
        createMessage("user", trimmedInput),
      ]);
      setInput("");

      const activeDocumentId = attachedFile
        ? await ingestAttachedDocument(attachedFile)
        : documentId;

      chatMutation.mutate({ activeDocumentId, message: trimmedInput });
    } catch (pipelineError: unknown) {
      const errorMessage =
        pipelineError instanceof Error
          ? pipelineError.message
          : "Unable to prepare the attached document.";
      setError(errorMessage);
    }
  };

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

  return (
    <div
      className={`flex h-[58vh] min-h-[460px] flex-col rounded-md border border-zinc-900 bg-zinc-950/70 ${className ?? ""}`}
    >
      <div className="border-b border-zinc-900 px-4 py-3">
        <p className="text-sm font-semibold text-zinc-100">Chat with Document</p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{fileName}</p>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <Conversation className="min-h-0">
          <ConversationContent className="gap-5 p-4">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquareText className="size-10" />}
                title={isIndexed ? "Ask a document question" : "Attach a document"}
                description={
                  isIndexed
                    ? "Answers are grounded in the selected OpenAI vector store."
                    : "Send a message with a file or photo to parse and index it automatically."
                }
              />
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}

            {progressMessage && (
              <div className="rounded-md border border-zinc-900 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
                {progressMessage}
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {error && (
          <div className="mx-4 mb-2 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border-t border-zinc-900 p-3">
          <ChatInput
            value={input}
            status={status}
            disabled={chatMutation.isPending || !!ingestionStage}
            onChange={setInput}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
