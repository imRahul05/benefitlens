"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Database, Sparkles } from "lucide-react";
import type { ChatStatus } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { askDocumentQuestion } from "@/lib/api/chat.api";
import { indexDocument } from "@/lib/api/parsing.api";
import { cn } from "@/lib/utils";
import type { ChatResponse } from "@/types/api.types";

import { ChatInput } from "./chat-input";
import { ChatMessage, type ChatPanelMessage } from "./chat-message";

const SUGGESTED_QUESTIONS = [
  "Summarize the key benefits in this document",
  "What is the deductible and out-of-pocket maximum?",
  "What's excluded or not covered?",
  "How do I file a claim?",
];

interface ChatPanelProps {
  documentId: string;
  fileName: string;
  isIndexed: boolean;
  className?: string;
  onIndexed?: (documentId: string) => void | Promise<void>;
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ErrorNotice({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-left text-xs text-red-300",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function ChatPanel({
  documentId,
  fileName,
  isIndexed,
  className,
  onIndexed,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chatMutation = useMutation({
    mutationFn: (message: string) => askDocumentQuestion({ documentId, message }),
    onSuccess: (result) => {
      setMessages((current) => [...current, createMessage("assistant", result.answer, result)]);
    },
    onError: (mutationError: unknown) => {
      setError(getErrorMessage(mutationError, "Unable to generate an answer."));
    },
  });

  const indexMutation = useMutation({
    mutationFn: () => indexDocument(documentId),
    onSuccess: async () => {
      setError(null);
      await onIndexed?.(documentId);
    },
    onError: (mutationError: unknown) => {
      setError(getErrorMessage(mutationError, "Indexing failed."));
    },
  });

  const status: ChatStatus = chatMutation.isPending ? "submitted" : "ready";

  const ask = (text: string) => {
    const question = text.trim();
    if (!question || chatMutation.isPending) {
      return;
    }

    setError(null);
    setMessages((current) => [...current, createMessage("user", question)]);
    setInput("");
    chatMutation.mutate(question);
  };

  const handleSubmit = (message: PromptInputMessage) => ask(message.text);

  if (!isIndexed) {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center p-6 text-center", className)}>
        <div className="mb-4 rounded-full border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
          <Database className="size-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">One more step before chatting</h3>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-zinc-400">
          &ldquo;{fileName}&rdquo; has been parsed but isn&apos;t indexed yet. Indexing
          makes its contents searchable so answers can cite it.
        </p>
        {error && <ErrorNotice message={error} className="mt-4 max-w-sm" />}
        <Button
          type="button"
          size="lg"
          className="mt-5 bg-emerald-500 px-4 text-zinc-950 hover:bg-emerald-400"
          disabled={indexMutation.isPending}
          onClick={() => indexMutation.mutate()}
        >
          {indexMutation.isPending ? (
            <>
              <Spinner size="sm" />
              Indexing document...
            </>
          ) : (
            <>
              <Database />
              Index document
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState className="min-h-[40vh]">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-100">
                  What would you like to know?
                </h3>
                <p className="max-w-md text-sm text-zinc-400">
                  Ask anything about <span className="text-zinc-200">{fileName}</span>.
                  Answers are grounded in the document and cite their sources.
                </p>
              </div>
              <Suggestions className="mt-4 max-w-xl">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Suggestion
                    key={question}
                    suggestion={question}
                    onClick={ask}
                    className="border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  />
                ))}
              </Suggestions>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}

          {chatMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Spinner size="sm" />
              Searching the document...
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        {error && <ErrorNotice message={error} className="mb-2" />}
        <ChatInput
          value={input}
          status={status}
          disabled={chatMutation.isPending}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
