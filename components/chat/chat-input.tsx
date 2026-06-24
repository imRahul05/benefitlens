"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  // PromptInputSelect,
  // PromptInputSelectContent,
  // PromptInputSelectItem,
  // PromptInputSelectTrigger,
  // PromptInputSelectValue,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import type { ChatStatus } from "ai";
import { GlobeIcon } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  value: string;
  status: ChatStatus;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void | Promise<void>;
}

// const models = [
//   { id: "configured", name: "Configured model" },
//   { id: "gpt-4o", name: "GPT-4o" },
//   { id: "gpt-4o-mini", name: "GPT-4o mini" },
// ];

function PromptInputAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

export function ChatInput({
  value,
  status,
  disabled = false,
  placeholder = "Ask about this document...",
  onChange,
  onSubmit,
}: ChatInputProps) {
  // const [model, setModel] = useState(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState(false);

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim() || disabled) {
      return;
    }

    onSubmit(message);
  };

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className="mt-3"
      globalDrop
      multiple
    >
      <PromptInputHeader>
        <PromptInputAttachmentsDisplay />
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="min-h-12 pr-12 text-sm"
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger disabled={disabled} />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments disabled={disabled} />
              <PromptInputActionAddScreenshot disabled={disabled} />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton
            disabled={disabled}
            onClick={() => setUseWebSearch((current) => !current)}
            tooltip={{ content: "Search the web", shortcut: "⌘K" }}
            variant={useWebSearch ? "default" : "ghost"}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
          {/* <PromptInputSelect
            onValueChange={(nextModel) => {
              if (typeof nextModel === "string") {
                setModel(nextModel);
              }
            }}
            value={model}
          >
            <PromptInputSelectTrigger disabled={disabled}>
              <PromptInputSelectValue />
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {models.map((modelOption) => (
                <PromptInputSelectItem
                  key={modelOption.id}
                  value={modelOption.id}
                >
                  {modelOption.name}
                </PromptInputSelectItem>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect> */}
        </PromptInputTools>
        <PromptInputSubmit
          status={status}
          disabled={disabled || !value.trim()}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
