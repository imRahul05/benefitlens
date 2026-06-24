"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueries } from "@tanstack/react-query";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { uploadDocument, getJobStatus, deleteDocument } from "@/lib/api/parsing.api";
import type { IndexDocumentResponse } from "@/types/api.types";
import type { ParseJob, JobStatus } from "@/types/job.types";

import { DocumentUpload } from "@/components/llamaparse/document-upload";
import { IngestionLogsList } from "@/components/llamaparse/ingestion-logs-list";
import { DocumentViewerModal } from "@/components/llamaparse/document-viewer-modal";

export default function HomePageClient() {
  const [jobs, setJobs] = useState<ParseJob[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("benefitlens-jobs");
        return stored ? (JSON.parse(stored) as ParseJob[]) : [];
      } catch (e) {
        console.error("Failed to parse stored jobs", e);
        return [];
      }
    }
    return [];
  });

  const [selectedJob, setSelectedJob] = useState<ParseJob | null>(null);

  // Update a job in state and save to localStorage
  const updateJobStatus = useCallback(
    (
      internalJobId: string,
      status: JobStatus,
      parsedContent?: string,
      error?: string,
      vectorStoreId?: string | null,
    ) => {
      setJobs((prev) => {
        const index = prev.findIndex((j) => j.internalJobId === internalJobId);
        if (index === -1) return prev;
        const currentJob = prev[index];

        const textToSave = parsedContent || currentJob.parsedText || "";

        if (
          currentJob.status === status &&
          (currentJob.parsedContent === parsedContent ||
            currentJob.parsedText === textToSave) &&
          currentJob.error === error &&
          currentJob.vectorStoreId === (vectorStoreId || currentJob.vectorStoreId)
        ) {
          return prev;
        }

        const updated = [...prev];
        updated[index] = {
          ...currentJob,
          status,
          parsedContent,
          parsedText: textToSave,
          error,
          vectorStoreId: vectorStoreId || currentJob.vectorStoreId,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem("benefitlens-jobs", JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  // Poll active jobs
  const activeJobs = useMemo(() => {
    return jobs.filter((job) => job.status === "PROCESSING" || job.status === "PENDING");
  }, [jobs]);

  // Set up React Query polling
  const pollingResults = useQueries({
    queries: activeJobs.map((job) => ({
      queryKey: ["jobStatus", job.internalJobId, job.llamaJobId],
      queryFn: () => getJobStatus(job.internalJobId, job.llamaJobId),
      refetchInterval: (query: unknown) => {
        const data = query as { state?: { data?: { status?: string } } };
        const status = data?.state?.data?.status;
        if (
          status === "SUCCESS" ||
          status === "PARTIAL_SUCCESS" ||
          status === "FAILED" ||
          status === "ERROR" ||
          status === "CANCELLED"
        ) {
          return false;
        }
        return 3000;
      },
      enabled: (job.status === "PROCESSING" || job.status === "PENDING") && !!job.llamaJobId,
    })),
  });

  // Watch polling queries and update status
  useEffect(() => {
    pollingResults.forEach((result, index) => {
      if (result.isSuccess && result.data) {
        const activeJob = activeJobs[index];
        const apiData = result.data;
        if (
          apiData.status === "SUCCESS" ||
          apiData.status === "PARTIAL_SUCCESS" ||
          apiData.status === "FAILED" ||
          apiData.status === "ERROR" ||
          apiData.status === "CANCELLED"
        ) {
          updateJobStatus(
            activeJob.internalJobId,
            apiData.status,
            apiData.parsedContent || apiData.parsedText,
            apiData.error,
            apiData.vectorStoreId,
          );
          toast.success(`Ingestion finished for "${activeJob.fileName}"`);
        }
      } else if (result.isError) {
        const activeJob = activeJobs[index];
        const errorMsg =
          result.error instanceof Error ? result.error.message : "Polling failed";
        updateJobStatus(activeJob.internalJobId, "ERROR", undefined, errorMsg);
        toast.error(`Tracking failed for "${activeJob.fileName}": ${errorMsg}`);
      }
    });
  }, [pollingResults, activeJobs, updateJobStatus]);

  // 10-Minute Polling Timeout Fail-Safe
  useEffect(() => {
    const checkTimeout = () => {
      const tenMinutesMs = 10 * 60 * 1000;
      const now = Date.now();

      jobs.forEach((job) => {
        if (job.status === "PROCESSING" || job.status === "PENDING") {
          const startTime = new Date(job.createdAt).getTime();
          if (now - startTime > tenMinutesMs) {
            updateJobStatus(
              job.internalJobId,
              "ERROR",
              undefined,
              "Parsing timed out after 10 minutes.",
            );
            toast.error(
              `Extraction timed out: "${job.fileName}" has been processing for more than 10 minutes.`,
            );
          }
        }
      });
    };

    const interval = setInterval(checkTimeout, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [jobs, updateJobStatus]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onMutate: async (file) => {
      const internalJobId = crypto.randomUUID();
      const newJob: ParseJob = {
        internalJobId,
        llamaJobId: "",
        fileName: file.name,
        fileSize: file.size,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setJobs((prev) => {
        const updated = [newJob, ...prev];
        localStorage.setItem("benefitlens-jobs", JSON.stringify(updated));
        return updated;
      });

      return { internalJobId };
    },
    onSuccess: (data, _, context) => {
      if (context?.internalJobId) {
        setJobs((prev) => {
          const index = prev.findIndex((j) => j.internalJobId === context.internalJobId);
          if (index === -1) return prev;
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            internalJobId: data.internalJobId,
            llamaJobId: data.llamaJobId,
            status: data.status,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem("benefitlens-jobs", JSON.stringify(updated));
          return updated;
        });
        toast.info("Document uploaded successfully! Beginning status tracking...");
      }
    },
    onError: (err, _, context) => {
      if (context?.internalJobId) {
        const errMsg = err instanceof Error ? err.message : "Upload request failed";
        updateJobStatus(context.internalJobId, "ERROR", undefined, errMsg);
        toast.error(`Upload failed: ${errMsg}`);
      }
    },
  });

  const triggerUpload = (file: File) => {
    const validExtensions = [
      ".pdf",
      ".docx",
      ".txt",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
    ];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(extension)) {
      toast.error(
        "Invalid file type! Supported formats: PDF, DOCX, TXT, and Images (PNG, JPG, WEBP).",
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large! Maximum limit is 10MB.");
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDelete = (internalJobId: string) => {
    setJobs((prev) => {
      const updated = prev.filter((j) => j.internalJobId !== internalJobId);
      localStorage.setItem("benefitlens-jobs", JSON.stringify(updated));
      return updated;
    });

    // Call delete API asynchronously to clear PostgreSQL record
    deleteDocument(internalJobId).catch((err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete document from database";
      console.error("Database deletion error:", errorMsg);
    });

    toast.success("Job removed from history");
  };

  const handleCopyMarkdown = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Markdown copied to clipboard!");
  };

  const handleIndexed = (jobId: string, result: IndexDocumentResponse) => {
    setJobs((prev) => {
      const updated = prev.map((job) =>
        job.internalJobId === jobId
          ? {
              ...job,
              vectorStoreId: result.vectorStoreId,
              chunkCount: result.chunkCount,
              updatedAt: new Date().toISOString(),
            }
          : job,
      );

      localStorage.setItem("benefitlens-jobs", JSON.stringify(updated));
      return updated;
    });

    setSelectedJob((current) =>
      current?.internalJobId === jobId
        ? {
            ...current,
            vectorStoreId: result.vectorStoreId,
            chunkCount: result.chunkCount,
            updatedAt: new Date().toISOString(),
          }
        : current,
    );
  };

  const stats = useMemo(() => {
    const total = jobs.length;
    const processing = jobs.filter(
      (j) => j.status === "PROCESSING" || j.status === "PENDING",
    ).length;
    const success = jobs.filter(
      (j) => j.status === "SUCCESS" || j.status === "PARTIAL_SUCCESS",
    ).length;
    return { total, processing, success };
  }, [jobs]);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            Document Ingestion Module
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Ingest PDF, Word, Plain Text, or Images and view parsed markdown outputs.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md">
            <span className="text-xs text-zinc-500 font-medium">Documents</span>
            <span className="text-lg font-bold text-zinc-300">{stats.total}</span>
          </div>
          <div className="flex flex-col px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md">
            <span className="text-xs text-zinc-500 font-medium">Tracking</span>
            <span className="text-lg font-bold text-amber-500 flex items-center gap-1.5">
              {stats.processing > 0 && <Spinner size="sm" className="text-amber-500" />}
              {stats.processing}
            </span>
          </div>
          <div className="flex flex-col px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md">
            <span className="text-xs text-zinc-500 font-medium">Ingested</span>
            <span className="text-lg font-bold text-emerald-500">{stats.success}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left column - Dropzone */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <DocumentUpload
            isPending={uploadMutation.isPending}
            onUpload={triggerUpload}
          />
        </div>

        {/* Right column - Ingestion List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <IngestionLogsList
            jobs={jobs}
            onViewResult={setSelectedJob}
            onDelete={handleDelete}
            isUploading={uploadMutation.isPending}
            uploadingFileName={uploadMutation.variables?.name}
          />
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        job={selectedJob}
        isOpen={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
        onCopy={handleCopyMarkdown}
        onIndexed={handleIndexed}
      />
    </div>
  );
}
