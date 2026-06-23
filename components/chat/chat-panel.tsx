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
import { askDocumentQuestion } from "@/lib/api/chat.api";
import type { ChatResponse } from "@/types/api.types";

import { ChatInput } from "./chat-input";
import { ChatMessage, type ChatPanelMessage } from "./chat-message";

interface ChatPanelProps {
  documentId: string;
  fileName: string;
  isIndexed: boolean;
  className?: string;
}

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

export function ChatPanel({
  documentId,
  fileName,
  isIndexed,
  className,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      askDocumentQuestion({
        documentId,
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
    return chatMutation.isPending ? "submitted" : "ready";
  }, [chatMutation.isPending]);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || chatMutation.isPending || !isIndexed) {
      return;
    }

    setError(null);
    setMessages((current) => [...current, createMessage("user", trimmedInput)]);
    setInput("");
    chatMutation.mutate(trimmedInput);
  };

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
                title={isIndexed ? "Ask a document question" : "Index required"}
                description={
                  isIndexed
                    ? "Answers are grounded in the selected OpenAI vector store."
                    : "Index this document before starting chat."
                }
              />
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}

            {chatMutation.isPending && (
              <div className="rounded-md border border-zinc-900 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
                Searching the indexed document...
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
            disabled={!isIndexed || chatMutation.isPending}
            onChange={setInput}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
