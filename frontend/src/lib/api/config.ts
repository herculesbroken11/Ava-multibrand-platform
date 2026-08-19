const DEFAULT_API_BASE_URL = "http://localhost:4000";
/** Must exceed backend search (10s) + LLM (25s) + request overhead (45s). */
export const CONVERSATION_REQUEST_TIMEOUT_MS = 50_000;

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "") || DEFAULT_API_BASE_URL;
}
