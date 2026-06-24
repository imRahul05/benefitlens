"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Database,
  FileText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getParsedDocuments } from "@/lib/api/parsing.api";
import type { ParsedDocumentSummary } from "@/types/api.types";
import { cn } from "@/lib/utils";


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
      className={`w-full rounded-md border p-3 text-left transition-colors ${selected
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
  const [activeTab, setActiveTab] = useState<"chat" | "docs">("chat");

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

  const handleDocumentReady = async (documentId: string) => {
    setSelectedDocumentId(documentId);
    await queryClient.invalidateQueries({ queryKey: ["parsedDocuments"] });
    toast.success("Document parsed and indexed. Chat is ready.");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-5 overflow-hidden">
      <header className="flex items-center justify-between border-b border-zinc-900 pb-3 sm:pb-4 gap-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-100 truncate">
            Document Chat
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 truncate sm:whitespace-normal">
            Ask grounded questions against parsed and indexed documents.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 text-xs h-8 sm:h-9 px-2 sm:px-3"
          onClick={() => documentsQuery.refetch()}
          disabled={documentsQuery.isFetching}
        >
          <RefreshCw
            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${documentsQuery.isFetching ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline ml-1.5">Refresh docs</span>
          <span className="sm:hidden ml-1">Refresh</span>
        </Button>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="flex rounded-lg bg-zinc-900/50 p-1 lg:hidden border border-zinc-800/50 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all duration-200",
            activeTab === "chat"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all duration-200",
            activeTab === "docs"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Parsed Docs ({documents.length})
        </button>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] flex-1 min-h-0 gap-3 sm:gap-4">
        <main className={cn(
          "min-h-0 flex-1 flex flex-col lg:flex lg:flex-1",
          activeTab === "chat" ? "flex" : "hidden"
        )}>
          <ChatPanel
            key={selectedDocument?.id ?? "new-chat"}
            documentId={selectedDocument?.id ?? ""}
            fileName={selectedDocument?.fileName ?? "New chat"}
            isIndexed={!!selectedDocument?.vectorStoreId}
            className="h-full min-h-0"
            onDocumentReady={handleDocumentReady}
          />
        </main>

        <aside className={cn(
          "min-h-0 rounded-md border border-zinc-900 bg-zinc-950/70 flex-col lg:flex",
          activeTab === "docs" ? "flex flex-1" : "hidden"
        )}>
          <div className="border-b border-zinc-900 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-100">Parsed Docs</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Select a document to chat with.
            </p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {documentsQuery.isLoading ? (
              <div className="flex items-center gap-2 p-3 text-sm text-zinc-500">
                <Spinner size="sm" />
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-md border border-zinc-900 bg-zinc-950/30 p-4 text-sm text-zinc-500">
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
  );
}


