"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  isPending: boolean;
  onUpload: (file: File) => void;
}

export function DocumentUpload({ isPending, onUpload }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  };

  return (
    <Card className="bg-zinc-900/30 border-zinc-800 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-lg">Upload Files</CardTitle>
        <CardDescription className="text-zinc-400">
          PDF, DOCX, TXT, PNG, JPG, WEBP.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300",
            isDragging
              ? "border-zinc-300 bg-zinc-800/40 scale-102"
              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/20",
          )}
        >
          <input
            type="file"
            id="file-input"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
            disabled={isPending}
          />

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 transition-colors">
              {isPending ? (
                <Spinner size="lg" className="text-zinc-300" />
              ) : (
                <UploadCloud className="h-8 w-8" />
              )}
            </div>

            {isPending ? (
              <div>
                <p className="font-semibold text-sm text-zinc-300">Uploading File...</p>
                <p className="text-xs text-zinc-500 mt-1">Connecting to webhook intake</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-sm text-zinc-300">
                  Drag & Drop or Click to Ingest
                </p>
                <p className="text-xs text-zinc-500 mt-1.5">
                  PDF, DOCX, TXT, PNG, JPG, WEBP (Max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
