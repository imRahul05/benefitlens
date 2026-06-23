"use client";

import { FileText, AlertCircle, Copy, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ParseJob } from "@/types/job.types";

interface DocumentViewerModalProps {
  job: ParseJob | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export function DocumentViewerModal({
  job,
  isOpen,
  onClose,
  onCopy,
}: DocumentViewerModalProps) {
  if (!job) return null;

  const parsedContentText = job.parsedContent || job.parsedText || "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-full md:max-w-3xl lg:max-w-4xl bg-zinc-950 border-zinc-800 shadow-2xl text-zinc-50 max-h-[90vh] md:max-h-[85vh] flex flex-col p-4 sm:p-6">
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

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 py-3 border-b border-zinc-900">
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

        {/* View Box */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 rounded-md max-h-[60vh] md:max-h-[55vh]">
          {parsedContentText ? (
            <pre className="p-4 bg-zinc-900/60 border border-zinc-900 rounded-lg text-sm text-zinc-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
              {parsedContentText}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500 gap-2">
              <AlertCircle className="h-8 w-8 text-zinc-700" />
              <p className="text-sm">Document parsing complete, but no content was returned.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
