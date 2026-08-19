import type { SourceReference, StructuredBlock } from "@product-reviews/contracts";
import type { BackendBrand } from "../brands/registry";
import type { RecordedTurn } from "../database/database-types";

export interface SuccessfulTurnLog {
  clientSessionId: string;
  brand: BackendBrand;
  userMessage: string;
  avaResponse: string;
  structuredResponse: StructuredBlock[] | undefined;
  sources: SourceReference[] | undefined;
  aiProvider: string;
  aiModel: string | null;
  responseDurationMs: number;
  searchUsed: boolean;
  searchIntent: string | null;
  searchStatus: string | null;
  searchProvider: string | null;
  searchResultCount: number;
  searchDurationMs?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}

export interface FailedTurnLog {
  clientSessionId: string;
  brand: BackendBrand;
  userMessage: string;
  aiProvider: string;
  aiModel: string | null;
  responseDurationMs: number;
  errorCode: string;
  searchUsed: boolean;
  searchIntent: string | null;
  searchStatus: string | null;
  searchProvider: string | null;
  searchResultCount: number;
}

export interface PersistenceResult {
  persisted: boolean;
  turn?: RecordedTurn;
}

export interface ConversationLogRepository {
  recordSuccessfulTurn(input: SuccessfulTurnLog): Promise<RecordedTurn>;
  recordFailedTurn(input: FailedTurnLog): Promise<RecordedTurn>;
}

export interface ConversationLoggingService {
  recordSuccessfulTurn(input: SuccessfulTurnLog): Promise<PersistenceResult>;
  recordFailedTurn(input: FailedTurnLog): Promise<PersistenceResult>;
}
