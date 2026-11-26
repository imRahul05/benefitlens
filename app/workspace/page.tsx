"use client";

import dynamic from "next/dynamic";

import { Spinner } from "@/components/ui/spinner";

// The workspace reads localStorage for in-flight jobs, so render it client-only.
const Workspace = dynamic(
  () => import("@/components/workspace/workspace").then((mod) => mod.Workspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-zinc-950">
        <Spinner size="lg" className="text-zinc-400" />
      </div>
    ),
  },
);

export default function WorkspacePage() {
  return <Workspace />;
}
