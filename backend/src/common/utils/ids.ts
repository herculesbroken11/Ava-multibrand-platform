export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function latestUserMessageContent(
  messages: Array<{ role: string; content: string }>,
): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return messages[index].content.trim();
    }
  }

  return "";
}
