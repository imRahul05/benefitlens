"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Database,
  FileText,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getParsedDocuments, indexDocument } from "@/lib/api/parsing.api";
import type { ParsedDocumentSummary } from "@/types/api.types";

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function DocumentRow({
  document,
  selected,
  onSelect,
}: {
  document: ParsedDocumentSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition-colors ${
        selected
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md border border-zinc-800 bg-zinc-900 p-2">
          <FileText className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {document.fileName}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatFileSize(document.fileSize)} • {document.chunkCount} chunks
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs">
            {document.vectorStoreId ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-400">Indexed</span>
              </>
            ) : (
              <>
                <Database className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-400">Needs indexing</span>
              </>
            )}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function ChatPageClient() {
  const queryClient = useQueryClient();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const documentsQuery = useQuery({
    queryKey: ["parsedDocuments"],
    queryFn: getParsedDocuments,
  });

  const documents = useMemo(
    () => documentsQuery.data?.documents ?? [],
    [documentsQuery.data?.documents],
  );

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ??
    documents[0] ??
    null;

  const indexMutation = useMutation({
    mutationFn: (documentId: string) => indexDocument(documentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["parsedDocuments"] });
      toast.success("Document indexed. Chat is ready.");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Indexing failed";
      toast.error(message);
    },
  });

  const isSelectedIndexed = !!selectedDocument?.vectorStoreId;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-5">
        <header className="flex flex-col gap-3 border-b border-zinc-900 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Document Chat
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Ask grounded questions against parsed and indexed documents.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-fit border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => documentsQuery.refetch()}
            disabled={documentsQuery.isFetching}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${documentsQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh docs
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-h-0">
            {!selectedDocument ? (
              <div className="flex h-[calc(100vh-140px)] min-h-[520px] flex-col items-center justify-center rounded-md border border-zinc-900 bg-zinc-950/70 p-8 text-center">
                <MessageSquareText className="h-10 w-10 text-zinc-700" />
                <p className="mt-3 text-sm font-semibold text-zinc-300">
                  No parsed documents yet
                </p>
                <p className="mt-1 max-w-sm text-sm text-zinc-500">
                  Upload and parse a document from the ingestion page, then return here
                  to chat with it.
                </p>
              </div>
            ) : isSelectedIndexed ? (
              <ChatPanel
                key={selectedDocument.id}
                documentId={selectedDocument.id}
                fileName={selectedDocument.fileName}
                isIndexed
                className="h-[calc(100vh-140px)] min-h-[560px]"
              />
            ) : (
              <div className="flex h-[calc(100vh-140px)] min-h-[560px] flex-col items-center justify-center rounded-md border border-zinc-900 bg-zinc-950/70 p-8 text-center">
                <Database className="h-10 w-10 text-amber-500" />
                <p className="mt-3 text-sm font-semibold text-zinc-200">
                  Index this document to continue
                </p>
                <p className="mt-1 max-w-md text-sm text-zinc-500">
                  {selectedDocument.fileName} has parsed markdown, but no OpenAI
                  vector store yet. Index it before starting chat.
                </p>
                <Button
                  className="mt-5 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  disabled={indexMutation.isPending}
                  onClick={() => indexMutation.mutate(selectedDocument.id)}
                >
                  {indexMutation.isPending ? (
                    <Spinner size="sm" className="text-zinc-950" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  Index this doc
                </Button>
              </div>
            )}
          </main>

          <aside className="min-h-0 rounded-md border border-zinc-900 bg-zinc-950/70">
            <div className="border-b border-zinc-900 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">Parsed Docs</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Select a document to chat with.
              </p>
            </div>

            <div className="max-h-[calc(100vh-190px)] space-y-2 overflow-y-auto p-3">
              {documentsQuery.isLoading ? (
                <div className="flex items-center gap-2 p-3 text-sm text-zinc-500">
                  <Spinner size="sm" />
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-md border border-zinc-900 bg-zinc-900/30 p-4 text-sm text-zinc-500">
                  No parsed documents found.
                </div>
              ) : (
                documents.map((document) => (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    selected={selectedDocument?.id === document.id}
                    onSelect={() => setSelectedDocumentId(document.id)}
                  />
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
