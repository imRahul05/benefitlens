"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, FileText, Info, PanelLeft } from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand-logo";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useDocumentPipeline } from "@/hooks/use-document-pipeline";
import { deleteDocument, getParsedDocuments } from "@/lib/api/parsing.api";
import { SUPPORTED_UPLOAD_ACCEPT } from "@/lib/uploads/file-validation";

import { DocumentDetailsSheet } from "./document-details-sheet";
import { DocumentLibrary } from "./document-library";
import { UploadDropzone } from "./upload-dropzone";

const DOCUMENTS_QUERY_KEY = ["parsedDocuments"] as const;

const steps = [
  { title: "Upload", description: "Drop in a policy, plan summary or benefits booklet." },
  { title: "Parse & index", description: "We extract the text and make it searchable — automatically." },
  { title: "Ask", description: "Chat opens when it's ready. Every answer cites its source." },
];

export function Workspace() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const documentsQuery = useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: getParsedDocuments,
  });

  const documents = useMemo(
    () => documentsQuery.data?.documents ?? [],
    [documentsQuery.data?.documents],
  );
  const selectedDocument = documents.find((document) => document.id === selectedId) ?? null;

  const refreshDocuments = useCallback(
    () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY }),
    [queryClient],
  );

  const pipeline = useDocumentPipeline({
    onDocumentReady: async (documentId, fileName) => {
      await refreshDocuments();
      setSelectedId(documentId);
      toast.success(`"${fileName}" is ready. Ask away!`);
    },
    onIndexFailed: async (documentId) => {
      await refreshDocuments();
      setSelectedId(documentId);
    },
  });

  const handleUpload = (file: File) => {
    setSelectedId(null);
    setLibraryOpen(false);
    void pipeline.upload(file);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setLibraryOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDetailsOpen(false);
      if (selectedId === id) {
        setSelectedId(null);
      }
      await refreshDocuments();
      toast.success("Document deleted");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
    }
  };

  const library = (
    <DocumentLibrary
      documents={documents}
      pipeline={pipeline.items}
      selectedId={selectedId}
      isLoading={documentsQuery.isLoading}
      isFetching={documentsQuery.isFetching}
      onSelect={handleSelect}
      onNewUpload={openFilePicker}
      onRefresh={() => void documentsQuery.refetch()}
      onDismissPipelineItem={pipeline.dismiss}
    />
  );

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-50">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={SUPPORTED_UPLOAD_ACCEPT}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleUpload(file);
          event.target.value = "";
        }}
      />

      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-900 px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 lg:hidden"
          onClick={() => setLibraryOpen(true)}
          aria-label="Open library"
        >
          <PanelLeft />
        </Button>
        <BrandLogo />
        <span className="hidden h-4 w-px bg-zinc-800 sm:block" />
        <span className="hidden text-sm text-zinc-500 sm:block">Workspace</span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Library rail (desktop) */}
        <aside className="hidden w-72 shrink-0 border-r border-zinc-900 lg:block">{library}</aside>

        {/* Library drawer (mobile) */}
        <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
          <SheetContent
            side="left"
            className="w-80 gap-0 border-zinc-900 bg-zinc-950 p-0 pt-12 text-zinc-50"
          >
            <SheetTitle className="sr-only">Document library</SheetTitle>
            {library}
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col">
          {selectedDocument ? (
            <>
              <div className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-900 px-4">
                <FileText className="size-4 shrink-0 text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {selectedDocument.fileName}
                  </p>
                </div>
                <span className="hidden items-center gap-1 text-xs text-zinc-500 sm:flex">
                  {selectedDocument.vectorStoreId ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      Ready · {selectedDocument.chunkCount} chunks
                    </>
                  ) : (
                    <>
                      <Circle className="size-3.5 text-amber-500" />
                      Needs indexing
                    </>
                  )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsOpen(true)}
                >
                  <Info />
                  Details
                </Button>
              </div>
              <ChatPanel
                key={selectedDocument.id}
                documentId={selectedDocument.id}
                fileName={selectedDocument.fileName}
                isIndexed={!!selectedDocument.vectorStoreId}
                onIndexed={async () => {
                  await refreshDocuments();
                  toast.success("Document indexed. Chat is ready.");
                }}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
              <div className="w-full max-w-2xl">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                    {pipeline.isBusy
                      ? "Preparing your document…"
                      : "What document should we read today?"}
                  </h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    {pipeline.isBusy
                      ? "Track progress in the library. The chat opens automatically when it's ready."
                      : documents.length > 0
                        ? "Upload a new document, or pick one from your library to continue."
                        : "Upload a benefits document and start asking questions about it."}
                  </p>
                </div>

                <UploadDropzone onUpload={handleUpload} className="mt-8" />

                <ol className="mt-8 grid gap-3 sm:grid-cols-3">
                  {steps.map((step, index) => (
                    <li
                      key={step.title}
                      className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-4"
                    >
                      <p className="font-mono text-[11px] text-emerald-400">0{index + 1}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-200">{step.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        {step.description}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </main>
      </div>

      <DocumentDetailsSheet
        key={selectedDocument?.id ?? "none"}
        document={selectedDocument}
        open={detailsOpen && !!selectedDocument}
        onOpenChange={setDetailsOpen}
        onDelete={(id) => void handleDelete(id)}
      />
    </div>
  );
}
