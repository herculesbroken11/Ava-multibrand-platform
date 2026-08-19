export const API_PREFIX = "/api/v1";
export const HEALTH_PATH = "/api/v1/health";
export const CONVERSATION_MESSAGE_PATH = "/api/v1/conversation/message";

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_MESSAGES_PER_REQUEST = 40;
export const MOCK_ERROR_TRIGGER = "__simulate_error__";

export type ConversationRole = "user" | "ava";
export type MessageRole = ConversationRole;
export type MessageStatus = "complete" | "pending" | "error";

export interface SourceReference {
  title: string;
  domain: string;
  url: string;
  date?: string;
}

export interface ComparisonColumn {
  key: string;
  label: string;
}

export interface ComparisonTableData {
  caption?: string;
  columns: ComparisonColumn[];
  rows: Array<Record<string, string>>;
}

export type StructuredBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "recommendation"; title?: string; text: string }
  | { type: "advantages"; heading?: string; items: string[] }
  | { type: "limitations"; heading?: string; items: string[] }
  | { type: "considerations"; heading?: string; items: string[] }
  | { type: "followUpPrompt"; text: string }
  | { type: "comparison"; table: ComparisonTableData }
  | { type: "sources"; sources: SourceReference[] };

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  content: string;
  createdAt: string;
  status?: MessageStatus;
  structuredContent?: StructuredBlock[];
  sources?: SourceReference[];
  followUps?: string[];
}

export interface ConversationRequest {
  brandId: string;
  sessionId: string;
  messages: ConversationMessage[];
}

export interface ConversationResponse {
  message: ConversationMessage;
  followUps: string[];
}

export interface HealthResponse {
  status: "ok";
  service: string;
  environment: string;
  time: string;
  aiProvider?: string;
  searchProvider?: string;
  database?: {
    enabled: boolean;
    reachable: boolean;
  };
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNKNOWN_BRAND: "UNKNOWN_BRAND",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  PROVIDER_TIMEOUT: "PROVIDER_TIMEOUT",
  PROVIDER_RATE_LIMIT: "PROVIDER_RATE_LIMIT",
  PROVIDER_AUTH: "PROVIDER_AUTH",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  PROVIDER_INVALID_RESPONSE: "PROVIDER_INVALID_RESPONSE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
