import type { Metadata } from "next";
import { Providers } from "./providers";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "LlamaParse Webhook Test App",
  description: "A minimal standalone application to verify LlamaParse processing status.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col bg-zinc-950 text-zinc-50 min-h-screen">
              <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-900 px-6 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
                <SidebarTrigger className="-ml-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900" />
                <div className="h-4 w-px bg-zinc-800" />
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  BenefitLens Platform
                </span>
              </header>
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}

