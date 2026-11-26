import { redirect } from "next/navigation";

// Legacy route: chat now lives in the unified workspace.
export default function LegacyChatPage() {
  redirect("/workspace");
}
