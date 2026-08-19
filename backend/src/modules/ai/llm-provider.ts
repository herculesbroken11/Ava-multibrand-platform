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

export interface LlmTokenUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export interface LlmCompletionResult {
  text: string;
  usage?: LlmTokenUsage;
}

export interface LlmProvider {
  complete(input: LlmCompletionInput): Promise<LlmCompletionResult>;
}
