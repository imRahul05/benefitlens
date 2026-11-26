import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  FileDown,
  FileSearch,
  FileUp,
  Library,
  MessageSquareText,
  Quote,
  ScanText,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ProductPreview } from "./product-preview";

const steps = [
  {
    icon: FileUp,
    title: "Upload your document",
    description:
      "Drop in a benefits booklet, insurance policy or plan summary — PDF, Word, text or a photo of a page.",
  },
  {
    icon: ScanText,
    title: "We read and index it",
    description:
      "LlamaParse extracts text and tables into clean markdown, then BenefitLens chunks and indexes it for search.",
  },
  {
    icon: MessageSquareText,
    title: "Ask in plain language",
    description:
      "Get answers grounded only in your document, with the exact passages they came from one click away.",
  },
];

const features = [
  {
    icon: Quote,
    title: "Answers with citations",
    description:
      "Every reply links back to the source chunks it used, so you can verify before you rely on it.",
  },
  {
    icon: FileSearch,
    title: "High-fidelity parsing",
    description:
      "Tables, headings and multi-column layouts survive extraction — the fine print stays intact.",
  },
  {
    icon: Zap,
    title: "Upload to chat in one flow",
    description:
      "Parsing and indexing happen automatically. The chat opens the moment your document is ready.",
  },
  {
    icon: Library,
    title: "A persistent library",
    description:
      "Every document you process stays in your library, ready to pick up any conversation later.",
  },
  {
    icon: Boxes,
    title: "Inspect every chunk",
    description:
      "See exactly how a document was split and what the model can search, chunk by chunk.",
  },
  {
    icon: FileDown,
    title: "Export clean markdown",
    description:
      "Copy or download the parsed markdown to reuse it in notes, tickets or other tools.",
  },
];

const exampleQuestions = [
  "Is physical therapy covered, and how many visits?",
  "What's the copay for a specialist visit?",
  "Do I need a referral to see a dermatologist?",
  "How does my HSA contribution limit work?",
  "Which preventive services are free?",
  "What counts toward my deductible?",
];

const formats = ["PDF", "DOCX", "TXT", "PNG", "JPG", "WEBP"];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-pretty text-zinc-400">{description}</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-50">
      {/* Background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[720px] bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-900/80 bg-zinc-950/70 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-zinc-100">
              How it works
            </a>
            <a href="#features" className="transition-colors hover:text-zinc-100">
              Features
            </a>
            <a href="#questions" className="transition-colors hover:text-zinc-100">
              Examples
            </a>
          </div>
          <Link
            href="/workspace"
            className={cn(buttonVariants({ size: "lg" }), "px-3.5")}
          >
            Open workspace
            <ArrowRight data-icon="inline-end" />
          </Link>
        </nav>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              Answers grounded in your own documents
            </div>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
              Understand your benefits{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                in plain language
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-zinc-400 sm:text-lg">
              BenefitLens turns dense insurance policies and benefits booklets into a
              conversation. Upload a document, ask what you actually want to know, and
              get cited answers in seconds.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/workspace"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 w-full bg-emerald-500 px-5 text-zinc-950 hover:bg-emerald-400 sm:w-auto",
                )}
              >
                Upload a document
                <ArrowRight data-icon="inline-end" />
              </Link>
              <a
                href="#how-it-works"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 w-full px-5 sm:w-auto",
                )}
              >
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
              <span>Supports</span>
              {formats.map((format) => (
                <span
                  key={format}
                  className="rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-0.5 font-mono text-[11px] text-zinc-400"
                >
                  {format}
                </span>
              ))}
              <span>· up to 10 MB</span>
            </div>
          </div>

          <div className="mt-16 sm:mt-20">
            <ProductPreview />
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-t border-zinc-900 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="How it works"
              title="From fine print to answers in three steps"
              description="No setup, no prompts to engineer. One upload takes you straight to a conversation with your document."
            />
            <ol className="mt-14 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="relative rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-emerald-400">
                        <Icon className="size-5" />
                      </span>
                      <span className="font-mono text-xs text-zinc-600">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 font-semibold text-zinc-100">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {step.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-20 border-t border-zinc-900 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Features"
              title="Built for documents you can't afford to misread"
              description="Retrieval-augmented answers that stay faithful to the source, with the tools to check them."
            />
            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-zinc-950 p-6 transition-colors hover:bg-zinc-900/60"
                  >
                    <Icon className="size-5 text-emerald-400" />
                    <h3 className="mt-4 font-semibold text-zinc-100">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Example questions */}
        <section
          id="questions"
          className="scroll-mt-20 border-t border-zinc-900 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Examples"
              title="Ask the questions you actually have"
              description="The kind of things that usually take twenty minutes of scrolling through a PDF."
            />
            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-2.5">
              {exampleQuestions.map((question) => (
                <span
                  key={question}
                  className="rounded-full border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300"
                >
                  {question}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-zinc-900 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 px-6 py-14 text-center sm:px-12">
              <div
                aria-hidden
                className="absolute inset-0 -z-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(16,185,129,0.16),transparent)]"
              />
              <div className="relative">
                <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                  Stop guessing what your plan covers
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-zinc-400">
                  Upload your first document and start asking questions in under a
                  minute.
                </p>
                <Link
                  href="/workspace"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "mt-8 h-11 bg-emerald-500 px-5 text-zinc-950 hover:bg-emerald-400",
                  )}
                >
                  Open the workspace
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6">
          <BrandLogo className="text-sm" />
          <p>Powered by LlamaParse and OpenAI file search.</p>
        </div>
      </footer>
    </div>
  );
}
