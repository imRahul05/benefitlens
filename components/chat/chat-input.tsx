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
  onSubmit: () => void;
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

    onSubmit();
  };

  return (
    <PromptInput onSubmit={handleSubmit} className="mt-3">
      <PromptInputBody>
        <PromptInputTextarea
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="min-h-12 pr-12 text-sm"
        />
      </PromptInputBody>
      <PromptInputFooter className="justify-end">
        <PromptInputSubmit
          status={status}
          disabled={disabled || !value.trim()}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
