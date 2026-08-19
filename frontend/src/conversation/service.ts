import { httpConversationService } from "@/lib/api/conversation-client";
import type { ConversationService } from "@/conversation/types";

export function getConversationService(): ConversationService {
  return httpConversationService;
}
