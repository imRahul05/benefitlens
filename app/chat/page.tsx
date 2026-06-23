"use client";

import dynamic from "next/dynamic";

import { Spinner } from "@/components/ui/spinner";

const ChatPageClient = dynamic(() => import("./page-client"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-950">
      <Spinner size="lg" className="text-zinc-400" />
    </div>
  ),
});

export default function ChatPage() {
  return <ChatPageClient />;
}
