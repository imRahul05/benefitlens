"use client";

import {
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import type { ChatSource } from "@/types/api.types";

interface SourceViewerProps {
  sources: ChatSource[];
}

export function SourceViewer({ sources }: SourceViewerProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <Sources className="mt-3 text-zinc-300">
      <SourcesTrigger
        count={sources.length}
        className="text-xs text-zinc-400 hover:text-zinc-200"
      />
      <SourcesContent className="w-full max-w-full">
        <div className="grid gap-2">
          {sources.map((source, index) => (
            <div
              key={`${source.chunkId}-${index}`}
              className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-200">
                  Chunk{" "}
                  {source.chunkIndex === undefined
                    ? index + 1
                    : source.chunkIndex + 1}
                </p>
                {source.score !== undefined && (
                  <p className="text-[10px] text-zinc-500">
                    Score {source.score.toFixed(2)}
                  </p>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-400">
                {source.content}
              </p>
            </div>
          ))}
        </div>
      </SourcesContent>
    </Sources>
  );
}
