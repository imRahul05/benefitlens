"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";

const HomePageClient = dynamic(() => import("./homepage-client"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-zinc-950 min-h-screen">
      <Spinner size="lg" className="text-zinc-400" />
    </div>
  ),
});

export default function HomePage() {
  return <HomePageClient />;
}