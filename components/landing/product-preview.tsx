import {
  ArrowUp,
  CheckCircle2,
  FileText,
  Quote,
  Sparkles,
} from "lucide-react";

const libraryItems = [
  { name: "2026 Medical Plan SPD.pdf", meta: "84 chunks", active: true },
  { name: "Dental PPO Summary.pdf", meta: "22 chunks", active: false },
  { name: "Vision Benefits.docx", meta: "9 chunks", active: false },
];

/**
 * Static, illustrative mock of the workspace used on the landing page.
 * Styled to mirror the real chat UI (AI Elements conversation + prompt input).
 */
export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div
        aria-hidden
        className="absolute -inset-x-10 -top-10 -bottom-4 -z-10 rounded-[2rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent_70%)]"
      />
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 ring-1 ring-white/5">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-zinc-900 bg-zinc-950 px-4 py-3">
          <span className="size-2.5 rounded-full bg-zinc-800" />
          <span className="size-2.5 rounded-full bg-zinc-800" />
          <span className="size-2.5 rounded-full bg-zinc-800" />
          <span className="ml-3 truncate text-xs text-zinc-500">
            benefitlens / workspace
          </span>
        </div>

        <div className="grid md:grid-cols-[240px_1fr]">
          {/* Library rail */}
          <div className="hidden border-r border-zinc-900 bg-zinc-950 p-3 md:block">
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Library
            </p>
            <div className="space-y-1">
              {libraryItems.map((item) => (
                <div
                  key={item.name}
                  className={
                    item.active
                      ? "flex items-center gap-2.5 rounded-lg bg-zinc-900 px-2 py-2"
                      : "flex items-center gap-2.5 rounded-lg px-2 py-2"
                  }
                >
                  <FileText className="size-4 shrink-0 text-zinc-500" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-200">
                      {item.name}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <CheckCircle2 className="size-3 text-emerald-500" />
                      {item.meta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="flex min-h-[380px] flex-col">
            <div className="flex-1 space-y-5 p-5 sm:p-6">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100">
                  What&apos;s my out-of-pocket maximum for in-network care?
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="min-w-0 space-y-3 text-sm leading-relaxed text-zinc-300">
                  <p>
                    Your in-network out-of-pocket maximum is{" "}
                    <span className="font-semibold text-zinc-100">$3,500 per person</span>{" "}
                    and{" "}
                    <span className="font-semibold text-zinc-100">$7,000 per family</span>.
                    Deductibles, coinsurance and copays all count toward it; premiums
                    and out-of-network charges do not.
                  </p>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                      <Quote className="size-3" />
                      Source · Chunk 14
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500">
                      &ldquo;The annual out-of-pocket maximum for covered in-network
                      services is $3,500 (individual) / $7,000 (family)&hellip;&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-900 p-3 sm:p-4">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-2 pl-4 pr-2">
                <span className="flex-1 truncate text-sm text-zinc-500">
                  Ask about deductibles, copays, coverage limits&hellip;
                </span>
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950">
                  <ArrowUp className="size-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
