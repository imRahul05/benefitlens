"use client";

import { AlertCircle, CheckCircle2, Circle, FileText, Plus, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { PipelineItem, PipelineStage } from "@/hooks/use-document-pipeline";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ParsedDocumentSummary } from "@/types/api.types";

const STAGES: { key: Exclude<PipelineStage, "failed">; label: string }[] = [
  { key: "uploading", label: "Upload" },
  { key: "parsing", label: "Parse" },
  { key: "indexing", label: "Index" },
];

function PipelineRow({ item, onDismiss }: { item: PipelineItem; onDismiss: () => void }) {
  const failed = item.stage === "failed";
  const activeIndex = STAGES.findIndex((stage) => stage.key === item.stage);

  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        failed ? "border-red-500/20 bg-red-500/5" : "border-zinc-800 bg-zinc-900/40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">
          {failed ? (
            <AlertCircle className="size-4 text-red-400" />
          ) : (
            <Spinner size="sm" className="text-emerald-400" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-200">{item.fileName}</p>
          {failed ? (
            <p className="mt-1 line-clamp-2 text-[11px] text-red-300">
              {item.error || "Processing failed."}
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-1.5">
              {STAGES.map((stage, index) => (
                <div key={stage.key} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      index < activeIndex && "text-emerald-400",
                      index === activeIndex && "text-zinc-100",
                      index > activeIndex && "text-zinc-600",
                    )}
                  >
                    {stage.label}
                  </span>
                  {index < STAGES.length - 1 && (
                    <span
                      className={cn(
                        "h-px w-3",
                        index < activeIndex ? "bg-emerald-500/50" : "bg-zinc-800",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {failed && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-zinc-500 hover:text-zinc-200"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}

interface DocumentLibraryProps {
  documents: ParsedDocumentSummary[];
  pipeline: PipelineItem[];
  selectedId: string | null;
  isLoading: boolean;
  isFetching: boolean;
  onSelect: (id: string) => void;
  onNewUpload: () => void;
  onRefresh: () => void;
  onDismissPipelineItem: (id: string) => void;
}

export function DocumentLibrary({
  documents,
  pipeline,
  selectedId,
  isLoading,
  isFetching,
  onSelect,
  onNewUpload,
  onRefresh,
  onDismissPipelineItem,
}: DocumentLibraryProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3">
        <Button
          size="lg"
          className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          onClick={onNewUpload}
        >
          <Plus />
          New document
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-3">
        {pipeline.length > 0 && (
          <section>
            <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Processing
            </p>
            <div className="space-y-2">
              {pipeline.map((item) => (
                <PipelineRow
                  key={item.id}
                  item={item}
                  onDismiss={() => onDismissPipelineItem(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Library
            </p>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-zinc-500 hover:text-zinc-200"
              onClick={onRefresh}
              disabled={isFetching}
              aria-label="Refresh library"
            >
              <RefreshCw className={cn(isFetching && "animate-spin")} />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 px-1 py-2 text-xs text-zinc-500">
              <Spinner size="sm" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <p className="px-1 py-2 text-xs leading-relaxed text-zinc-500">
              No documents yet. Upload one to get started.
            </p>
          ) : (
            <div className="space-y-1">
              {documents.map((document) => {
                const selected = document.id === selectedId;
                return (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => onSelect(document.id)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      selected ? "bg-zinc-800/80" : "hover:bg-zinc-900",
                    )}
                  >
                    <FileText
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        selected ? "text-zinc-200" : "text-zinc-500",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-xs font-medium",
                          selected ? "text-zinc-50" : "text-zinc-300",
                        )}
                      >
                        {document.fileName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
                        {document.vectorStoreId ? (
                          <CheckCircle2 className="size-3 text-emerald-500" />
                        ) : (
                          <Circle className="size-3 text-amber-500" />
                        )}
                        {document.vectorStoreId ? "Ready" : "Needs indexing"} ·{" "}
                        {formatFileSize(document.fileSize)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
