import { redirect } from "next/navigation";

// Legacy route: ingestion now lives in the unified workspace.
export default function LegacyHomePage() {
  redirect("/workspace");
}
