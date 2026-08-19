import type { ConversationMessage } from "@product-reviews/contracts";

export interface LlmChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_MESSAGES = 16;
const MAX_HISTORY_CHARS = 12_000;
const MAX_SINGLE_MESSAGE_CHARS = 1_200;

function clip(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function toChatMessage(message: ConversationMessage): LlmChatMessage {
  return {
    role: message.role === "ava" ? "assistant" : "user",
    content: clip(message.content, MAX_SINGLE_MESSAGE_CHARS),
  };
}

/**
 * Keep the opening user request when useful, plus the most recent turns,
 * within a character budget. System instructions are never included here.
 */
export function buildLlmHistory(messages: ConversationMessage[]): LlmChatMessage[] {
  const usable = messages.filter((message) => message.content.trim().length > 0);
  if (usable.length === 0) return [];

  const firstUser = usable.find((message) => message.role === "user");
  const recent = usable.slice(-MAX_HISTORY_MESSAGES);

  const selected: ConversationMessage[] = [];

  if (firstUser && !recent.includes(firstUser)) {
    selected.push(firstUser);
  }

  for (const message of recent) {
    selected.push(message);
  }

  const chat = selected.map(toChatMessage);
  let total = chat.reduce((sum, item) => sum + item.content.length, 0);

  while (chat.length > 2 && total > MAX_HISTORY_CHARS) {
    const removed = firstUser && chat[0]?.content === clip(firstUser.content, MAX_SINGLE_MESSAGE_CHARS)
      ? chat.splice(1, 1)[0]
      : chat.shift();
    total -= removed?.content.length ?? 0;
  }

  return chat;
}
