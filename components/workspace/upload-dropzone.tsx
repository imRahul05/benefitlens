"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";

import { SUPPORTED_UPLOAD_ACCEPT } from "@/lib/uploads/file-validation";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onUpload: (file: File) => void;
  className?: string;
  compact?: boolean;
}

export function UploadDropzone({ onUpload, className, compact = false }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        compact ? "gap-2 p-4" : "gap-4 p-10",
        isDragging
          ? "border-emerald-500/60 bg-emerald-500/5"
          : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={SUPPORTED_UPLOAD_ACCEPT}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <span
        className={cn(
          "flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors group-hover:text-emerald-400",
          compact ? "size-8" : "size-12",
        )}
      >
        <FileUp className={compact ? "size-4" : "size-5"} />
      </span>
      <div>
        <p className={cn("font-medium text-zinc-200", compact ? "text-xs" : "text-sm")}>
          {compact ? "Drop a file or click to upload" : "Drop your document here, or click to browse"}
        </p>
        <p className={cn("mt-1 text-zinc-500", compact ? "text-[10px]" : "text-xs")}>
          PDF, DOCX, TXT, PNG, JPG, WEBP · up to 10 MB
        </p>
      </div>
    </div>
  );
}
