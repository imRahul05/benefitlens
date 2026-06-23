import { http } from "./http";
import type { ChatRequest, ChatResponse } from "@/types/api.types";

export function askDocumentQuestion(request: ChatRequest): Promise<ChatResponse> {
  return http.post<ChatResponse>("/api/chat", request);
}
