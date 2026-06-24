"use client";

import { Spinner } from "@/components/ui/spinner";
import { isFailedJobStatus, isSuccessfulJobStatus } from "@/lib/jobs/job-constant";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/job.types";

interface ProgressStepsProps {
  status: JobStatus;
  isUploading?: boolean;
}

export function ProgressSteps({ status, isUploading = false }: ProgressStepsProps) {
  const steps = [
    { label: "Uploading", key: "uploading" },
    { label: "Processing", key: "processing" },
    { label: "Parsing", key: "parsing" },
    { label: "Completed", key: "completed" },
  ];

  let currentStepIndex = -1;
  if (isUploading) {
    currentStepIndex = 0;
  } else if (status === "PENDING") {
    currentStepIndex = 1;
  } else if (status === "PROCESSING") {
    currentStepIndex = 2;
  } else if (isSuccessfulJobStatus(status)) {
    currentStepIndex = 3;
  }

  const isFailed = isFailedJobStatus(status);

  return (
    <div className="flex items-center w-full gap-1 mt-3 p-3 bg-zinc-950/70 border border-zinc-900 rounded-lg overflow-x-auto">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex;
        const isActive = idx === currentStepIndex;
        const isUpcoming = idx > currentStepIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial shrink-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-colors shrink-0",
                  isCompleted && "bg-emerald-500/10 border-emerald-500 text-emerald-500",
                  isActive &&
                    !isFailed &&
                    "bg-amber-500/10 border-amber-500 text-amber-500 animate-pulse",
                  isActive && isFailed && "bg-red-500/10 border-red-500 text-red-500",
                  isUpcoming && "bg-zinc-900 border-zinc-800 text-zinc-600",
                )}
              >
                {isCompleted ? (
                  "✓"
                ) : isActive && !isFailed && idx < 3 ? (
                  <Spinner size="sm" className="text-amber-500" />
                ) : isActive && isFailed ? (
                  "✕"
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold tracking-wider uppercase transition-colors shrink-0",
                  isCompleted && "text-zinc-500",
                  isActive && !isFailed && "text-amber-500",
                  isActive && isFailed && "text-red-500",
                  isUpcoming && "text-zinc-700",
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-[1px] min-w-[20px] flex-1 mx-2 transition-colors",
                  idx < currentStepIndex ? "bg-emerald-500/30" : "bg-zinc-900",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
