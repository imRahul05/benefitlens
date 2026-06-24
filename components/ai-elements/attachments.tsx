"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FileUIPart } from "ai";
import { FileIcon, XIcon } from "lucide-react";
import {
  createContext,
  useContext,
  type ComponentProps,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";

type AttachmentData = FileUIPart & { id?: string };

type AttachmentContextValue = {
  data: AttachmentData;
  onRemove?: () => void;
};

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

const useAttachment = () => {
  const context = useContext(AttachmentContext);

  if (!context) {
    throw new Error("Attachment components must be used inside <Attachment>.");
  }

  return context;
};

export type AttachmentsProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "inline";
};

export const Attachments = ({
  className,
  variant = "inline",
  ...props
}: AttachmentsProps) => (
  <div
    className={cn(
      "flex w-full min-w-0 flex-wrap items-center gap-1.5",
      variant === "inline" && "pb-1",
      className,
    )}
    {...props}
  />
);

export type AttachmentProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    data: AttachmentData;
    onRemove?: () => void;
  }
>;

export const Attachment = ({
  className,
  data,
  onRemove,
  children,
  ...props
}: AttachmentProps) => (
  <AttachmentContext.Provider value={{ data, onRemove }}>
    <div
      className={cn(
        "flex min-w-0 max-w-56 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  </AttachmentContext.Provider>
);

export type AttachmentPreviewProps = HTMLAttributes<HTMLDivElement>;

export const AttachmentPreview = ({
  className,
  ...props
}: AttachmentPreviewProps) => {
  const { data } = useAttachment();
  const isImage = data.mediaType?.startsWith("image/") && data.url;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 overflow-hidden",
        className,
      )}
      {...props}
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={data.filename ?? "Attachment"}
          className="size-6 shrink-0 rounded-sm object-cover"
          src={data.url}
        />
      ) : (
        <FileIcon className="size-4 shrink-0 text-zinc-400" />
      )}
      <span className="truncate">{data.filename ?? "Attachment"}</span>
    </div>
  );
};

export type AttachmentRemoveProps = ComponentProps<typeof Button>;

export const AttachmentRemove = ({
  className,
  ...props
}: AttachmentRemoveProps) => {
  const { onRemove } = useAttachment();

  return (
    <Button
      aria-label="Remove attachment"
      className={cn("size-5 shrink-0 rounded-md text-zinc-400", className)}
      onClick={onRemove}
      size="icon-xs"
      type="button"
      variant="ghost"
      {...props}
    >
      <XIcon className="size-3" />
    </Button>
  );
};
