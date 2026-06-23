"use client";

import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
      <Spinner size="lg" className="text-zinc-400" />
    </div>
  );
}
