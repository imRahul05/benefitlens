"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Copy,
  Database,
  FileDown,
  FileText,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getDocumentChunks, indexDocument } from "@/lib/api/parsing.api";
import type { IndexDocumentResponse } from "@/types/api.types";
import type { ParseJob } from "@/types/job.types";

interface DocumentViewerModalProps {
  job: ParseJob | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
  onIndexed?: (jobId: string, result: IndexDocumentResponse) => void;
}

export function DocumentViewerModal({
  job,
  isOpen,
  onClose,
  onCopy,
  onIndexed,
}: DocumentViewerModalProps) {
  const [indexedResult, setIndexedResult] = useState<IndexDocumentResponse | null>(null);
  const [activeView, setActiveView] = useState<"chunks" | "chat">("chunks");

  const chunksQuery = useQuery({
    queryKey: ["documentChunks", job?.internalJobId],
    queryFn: () => getDocumentChunks(job?.internalJobId || ""),
    enabled: isOpen && !!job?.internalJobId,
  });

  const indexMutation = useMutation({
    mutationFn: () => indexDocument(job?.internalJobId || ""),
    onSuccess: async (result) => {
      setIndexedResult(result);
      onIndexed?.(result.documentId, result);
      await chunksQuery.refetch();
      toast.success("Document indexed into OpenAI Vector Store");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Indexing failed";
      toast.error(message);
    },
  });

  if (!job) return null;

  const parsedContentText = job.parsedContent || job.parsedText || "";
  const chunks = chunksQuery.data?.chunks ?? [];
  const currentIndexedResult =
    indexedResult?.documentId === job.internalJobId ? indexedResult : null;
  const activeVectorStoreId =
    currentIndexedResult?.vectorStoreId || job.vectorStoreId || null;
  const activeChunkCount =
    currentIndexedResult?.chunkCount || job.chunkCount || chunks.length;
  const canIndex =
    (job.status === "SUCCESS" || job.status === "PARTIAL_SUCCESS") &&
    parsedContentText.trim().length > 0;

  const vectorStoreStatus = activeVectorStoreId ? "Indexed" : "Not indexed";
  const contentPreview =
    parsedContentText.length > 180
      ? `${parsedContentText.slice(0, 180)}...`
      : parsedContentText;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-full md:max-w-5xl bg-zinc-950 border-zinc-800 shadow-2xl text-zinc-50 max-h-[90vh] md:max-h-[88vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="border-b border-zinc-900 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-zinc-100 text-lg sm:text-xl font-bold flex items-center gap-2 break-all">
                <FileText className="h-5 w-5 text-zinc-400 shrink-0" />
                {job.fileName}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] sm:text-xs mt-1 break-all">
                Internal ID: {job.internalJobId} • Llama ID:{" "}
                {job.llamaJobId || "Webhook Handled"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 py-3 border-b border-zinc-900">
          <div className="rounded-md border border-zinc-900 bg-zinc-900/40 p-3">
            <p className="text-[10px] uppercase text-zinc-500">Status</p>
            <p className="text-sm font-semibold text-zinc-200 mt-1">{job.status}</p>
          </div>
          <div className="rounded-md border border-zinc-900 bg-zinc-900/40 p-3">
            <p className="text-[10px] uppercase text-zinc-500">Chunks</p>
            <p className="text-sm font-semibold text-zinc-200 mt-1">
              {chunksQuery.isLoading ? "Loading" : activeChunkCount}
            </p>
          </div>
          <div className="rounded-md border border-zinc-900 bg-zinc-900/40 p-3">
            <p className="text-[10px] uppercase text-zinc-500">Vector Store</p>
            <p className="text-sm font-semibold text-zinc-200 mt-1 flex items-center gap-1.5">
              {activeVectorStoreId ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Database className="h-3.5 w-3.5 text-zinc-500" />
              )}
              {vectorStoreStatus}
            </p>
          </div>
          <div className="rounded-md border border-zinc-900 bg-zinc-900/40 p-3 min-w-0">
            <p className="text-[10px] uppercase text-zinc-500">Vector Store ID</p>
            <p className="text-xs font-mono text-zinc-300 mt-1 truncate">
              {activeVectorStoreId || "Pending"}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 py-3 border-b border-zinc-900">
          <Button
            variant="outline"
            size="sm"
            className="bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-100 text-emerald-300 gap-1.5 text-xs"
            disabled={!canIndex || indexMutation.isPending || !!activeVectorStoreId}
            onClick={() => indexMutation.mutate()}
          >
            {indexMutation.isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5" />
            )}
            {activeVectorStoreId ? "Indexed" : "Index Vector Store"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`border-zinc-800 text-xs gap-1.5 ${
              activeView === "chunks"
                ? "bg-zinc-800 text-zinc-100"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
            onClick={() => setActiveView("chunks")}
          >
            <Boxes className="h-3.5 w-3.5" />
            View Chunks
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`border-zinc-800 text-xs gap-1.5 ${
              activeView === "chat"
                ? "bg-zinc-800 text-zinc-100"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
            disabled={!activeVectorStoreId}
            onClick={() => setActiveView("chat")}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Chat with Document
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-300 gap-1.5 text-xs"
            onClick={() => onCopy(parsedContentText)}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Content
          </Button>

          <a
            href={`data:text/markdown;charset=utf-8,${encodeURIComponent(parsedContentText)}`}
            download={`${job.fileName.substring(0, job.fileName.lastIndexOf("."))}_parsed.md`}
          >
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 text-zinc-300 gap-1.5 text-xs"
            >
              <FileDown className="h-3.5 w-3.5" />
              Download .md
            </Button>
          </a>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 rounded-md">
          {activeView === "chat" ? (
            <ChatPanel
              documentId={job.internalJobId}
              fileName={job.fileName}
              isIndexed={!!activeVectorStoreId}
            />
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-4">
            <div className="rounded-md border border-zinc-900 bg-zinc-900/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <FileText className="h-4 w-4 text-zinc-500" />
                Markdown Preview
              </div>
              {parsedContentText ? (
                <pre className="mt-3 text-xs text-zinc-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {contentPreview}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-zinc-500 gap-2">
                  <AlertCircle className="h-8 w-8 text-zinc-700" />
                  <p className="text-sm text-center">
                    Document parsing complete, but no content was returned.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-md border border-zinc-900 bg-zinc-900/20">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Boxes className="h-4 w-4 text-zinc-500" />
                  Chunks
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
                  onClick={() => chunksQuery.refetch()}
                  disabled={chunksQuery.isFetching}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${chunksQuery.isFetching ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {chunksQuery.isLoading ? (
                <div className="p-6 text-sm text-zinc-500">Loading chunks...</div>
              ) : chunks.length === 0 ? (
                <div className="p-6 text-sm text-zinc-500">
                  No chunks stored yet. Run vector store indexing to generate chunks.
                </div>
              ) : (
                <div className="divide-y divide-zinc-900 max-h-[48vh] overflow-y-auto">
                  {chunks.map((chunk) => (
                    <div key={chunk.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-200">
                          Chunk {chunk.chunkIndex + 1}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {chunk.characterCount} chars
                        </p>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap break-words">
                        {chunk.content.length > 420
                          ? `${chunk.content.slice(0, 420)}...`
                          : chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
