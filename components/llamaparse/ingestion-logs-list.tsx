"use client";

import { FileText, Ban, AlertCircle, Trash2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  isFailedJobStatus,
  isRunningJobStatus,
  isSuccessfulJobStatus,
} from "@/lib/jobs/job-constant";
import { ProgressSteps } from "./progress-steps";
import type { ParseJob } from "@/types/job.types";

interface IngestionLogsListProps {
  jobs: ParseJob[];
  onViewResult: (job: ParseJob) => void;
  onDelete: (internalJobId: string) => void;
  isUploading?: boolean;
  uploadingFileName?: string;
}

export function IngestionLogsList({
  jobs,
  onViewResult,
  onDelete,
  isUploading = false,
  uploadingFileName,
}: IngestionLogsListProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="bg-zinc-900/30 border-zinc-800 shadow-xl backdrop-blur-sm min-h-[420px] flex flex-col">
      <CardHeader className="border-b border-zinc-900">
        <CardTitle className="text-zinc-100 text-lg">Ingestion Pipeline Logs</CardTitle>
        <CardDescription className="text-zinc-400">
          Track status and view results.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 h-full gap-4 text-zinc-500">
            <FileText className="h-12 w-12 text-zinc-800" />
            <div>
              <p className="font-semibold text-zinc-400">Pipeline is empty</p>
              <p className="text-xs text-zinc-600 mt-1">
                Upload a document to trigger the LlamaParse parser.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900 max-h-[550px] overflow-y-auto">
            {jobs.map((job) => {
              const isJobFailed = isFailedJobStatus(job.status);
              const isRunning = isRunningJobStatus(job.status);

              return (
                <div
                  key={job.internalJobId}
                  className="p-4 flex flex-col gap-2 hover:bg-zinc-900/10 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md shrink-0">
                        <FileText className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-zinc-200 truncate max-w-[180px] sm:max-w-[300px]">
                          {job.fileName}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {formatSize(job.fileSize)} • ID:{" "}
                          <span className="font-mono text-[10px] text-zinc-400">
                            {job.internalJobId.slice(0, 8)}...
                          </span>
                          {job.vectorStoreId && (
                            <span className="ml-2 inline-flex items-center gap-1 text-emerald-500">
                              <Database className="h-3 w-3" />
                              Indexed
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Status Badge */}
                      {job.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Queued
                        </span>
                      ) : job.status === "PROCESSING" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Parsing
                        </span>
                      ) : job.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Success
                        </span>
                      ) : job.status === "PARTIAL_SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          Partial
                        </span>
                      ) : job.status === "CANCELLED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
                          <Ban className="h-2.5 w-2.5" />
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                          Failed
                        </span>
                      )}

                      {/* View Result */}
                      {isSuccessfulJobStatus(job.status) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 text-xs py-1 h-7"
                          onClick={() => onViewResult(job)}
                        >
                          Details
                        </Button>
                      )}

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={() => onDelete(job.internalJobId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Progressive Steps Visual Stepper */}
                  {(isRunning || isJobFailed || isSuccessfulJobStatus(job.status)) && (
                    <ProgressSteps
                      status={job.status}
                      isUploading={isUploading && uploadingFileName === job.fileName}
                    />
                  )}

                  {/* Error Log Panel */}
                  {isJobFailed && job.error && (
                    <div className="text-[11px] text-red-400 bg-red-500/5 border border-red-500/10 rounded-md p-2 flex items-start gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="break-all">{job.error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
