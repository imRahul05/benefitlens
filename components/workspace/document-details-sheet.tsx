"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Copy, FileDown, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { getDocumentChunks, getJobStatus } from "@/lib/api/parsing.api";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ParsedDocumentSummary } from "@/types/api.types";

interface DocumentDetailsSheetProps {
  document: ParsedDocumentSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

function markdownFileName(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return `${dot > 0 ? fileName.slice(0, dot) : fileName}_parsed.md`;
}

export function DocumentDetailsSheet({
  document,
  open,
  onOpenChange,
  onDelete,
}: DocumentDetailsSheetProps) {
  const [tab, setTab] = useState<"markdown" | "chunks">("markdown");
  const documentId = document?.id ?? "";

  const contentQuery = useQuery({
    queryKey: ["documentContent", documentId],
    queryFn: () => getJobStatus(documentId),
    enabled: open && !!documentId,
  });

  const chunksQuery = useQuery({
    queryKey: ["documentChunks", documentId],
    queryFn: () => getDocumentChunks(documentId),
    enabled: open && !!documentId && tab === "chunks",
  });

  const markdown = contentQuery.data?.parsedContent || contentQuery.data?.parsedText || "";
  const chunks = chunksQuery.data?.chunks ?? [];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    toast.success("Markdown copied to clipboard");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-50 data-[side=right]:sm:max-w-xl">
        {document && (
          <>
            <SheetHeader className="border-b border-zinc-900 p-5">
              <SheetTitle className="flex items-center gap-2 pr-8 text-zinc-100">
                <FileText className="size-4 shrink-0 text-zinc-400" />
                <span className="truncate">{document.fileName}</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500">
                {formatFileSize(document.fileSize)} · {document.chunkCount} chunks ·{" "}
                {document.vectorStoreId ? "Indexed" : "Not indexed"} · Added{" "}
                {new Date(document.createdAt).toLocaleDateString()}
              </SheetDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!markdown}
                  onClick={handleCopy}
                >
                  <Copy />
                  Copy markdown
                </Button>
                <a
                  href={
                    markdown
                      ? `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
                      : undefined
                  }
                  download={markdownFileName(document.fileName)}
                  aria-disabled={!markdown}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    !markdown && "pointer-events-none opacity-50",
                  )}
                >
                  <FileDown />
                  Download .md
                </a>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-auto"
                  onClick={() => onDelete(document.id)}
                >
                  <Trash2 />
                  Delete
                </Button>
              </div>
            </SheetHeader>

            <div className="flex gap-1 border-b border-zinc-900 px-5 pt-3">
              {(
                [
                  { key: "markdown", label: "Parsed markdown", icon: FileText },
                  { key: "chunks", label: "Chunks", icon: Boxes },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-xs font-medium transition-colors",
                    tab === key
                      ? "border-emerald-400 text-zinc-100"
                      : "border-transparent text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {tab === "markdown" ? (
                contentQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Spinner size="sm" /> Loading content...
                  </div>
                ) : markdown ? (
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-400">
                    {markdown}
                  </pre>
                ) : (
                  <p className="text-xs text-zinc-500">No parsed content was returned.</p>
                )
              ) : chunksQuery.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Spinner size="sm" /> Loading chunks...
                </div>
              ) : chunks.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No chunks yet. Chunks are created when the document is indexed.
                </p>
              ) : (
                <div className="space-y-3">
                  {chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-3"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-zinc-200">
                          Chunk {chunk.chunkIndex + 1}
                        </span>
                        <span className="text-zinc-500">{chunk.characterCount} chars</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-400">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
