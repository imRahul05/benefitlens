import Link from "next/link";
import { ScanSearch } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-semibold tracking-tight text-zinc-100", className)}
    >
      <span className="flex size-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <ScanSearch className="size-4" />
      </span>
      <span>BenefitLens</span>
    </Link>
  );
}
