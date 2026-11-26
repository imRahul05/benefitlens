"use client";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import type { ChatStatus } from "ai";

interface ChatInputProps {
  value: string;
  status: ChatStatus;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void | Promise<void>;
}

export function ChatInput({
  value,
  status,
  disabled = false,
  placeholder = "Ask about this document...",
  onChange,
  onSubmit,
}: ChatInputProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim() || disabled) {
      return;
    }

    onSubmit(message);
  };

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputBody>
        <PromptInputTextarea
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="min-h-12 text-sm"
        />
      </PromptInputBody>
      <PromptInputFooter className="justify-between">
        <p className="px-2 text-[11px] text-zinc-500">
          Answers come only from this document. Check the cited sources.
        </p>
        <PromptInputSubmit
          status={status}
          disabled={disabled || !value.trim()}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
