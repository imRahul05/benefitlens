import type { Metadata } from "next";
import { Providers } from "./providers";
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
