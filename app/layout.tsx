import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BenefitLens — Understand your benefits in plain language",
  description:
    "Upload insurance policies and benefits booklets, then ask questions and get answers grounded in your document, with citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-zinc-950 text-zinc-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
