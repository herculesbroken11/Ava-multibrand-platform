export type RequestStatus = "success" | "failed";

export interface ConversationSessionRecord {
  id: string;
  clientSessionId: string;
  brandId: string;
  domain: string;
  startedAt: Date;
  lastActivityAt: Date;
  turnCount: number;
  followUpCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationTurnRecord {
  id: string;
  sessionId: string;
  turnNumber: number;
  userMessage: string;
  avaResponse: string | null;
  structuredResponse: unknown | null;
  aiProvider: string;
  aiModel: string | null;
  responseDurationMs: number | null;
  requestStatus: RequestStatus;
  errorCode: string | null;
  searchUsed: boolean;
  searchIntent: string | null;
  searchStatus: string | null;
  searchProvider: string | null;
  searchResultCount: number;
  sources: unknown;
  createdAt: Date;
}

export interface RecordedTurn {
  session: ConversationSessionRecord;
  turn: ConversationTurnRecord;
}
