"use client";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import type { ChatSource } from "@/types/api.types";

import { SourceViewer } from "./source-viewer";

export interface ChatPanelMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

interface ChatMessageProps {
  message: ChatPanelMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <Message from={message.role}>
      <MessageContent>
        <MessageResponse>{message.content}</MessageResponse>
        {message.role === "assistant" && (
          <SourceViewer sources={message.sources ?? []} />
        )}
      </MessageContent>
    </Message>
  );
}
