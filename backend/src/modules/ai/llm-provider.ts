export interface LlmChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LlmCompletionInput {
  system: string;
  messages: LlmChatTurn[];
  maxOutputTokens: number;
  timeoutMs: number;
}

export interface LlmCompletionResult {
  text: string;
}

export interface LlmProvider {
  complete(input: LlmCompletionInput): Promise<LlmCompletionResult>;
}
