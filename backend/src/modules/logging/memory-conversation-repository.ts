import { randomUUID } from "node:crypto";
import { MAX_MESSAGE_LENGTH } from "@product-reviews/contracts";
import type {
  ConversationSessionRecord,
  RecordedTurn,
  RequestStatus,
} from "../database/database-types";
import type {
  ConversationLogRepository,
  FailedTurnLog,
  SuccessfulTurnLog,
} from "./logging-types";
import { clipLoggedText, trustedSourcesForLog } from "./postgres-conversation-repository";

const MAX_AVA_RESPONSE_CHARS = 4_000;
const MAX_SESSION_ID_CHARS = 128;

function sessionKey(brandId: string, clientSessionId: string): string {
  return `${brandId}::${clientSessionId}`;
}

export class MemoryConversationRepository implements ConversationLogRepository {
  readonly sessions = new Map<string, ConversationSessionRecord>();
  readonly turns: RecordedTurn["turn"][] = [];
  private readonly locks = new Map<string, Promise<void>>();

  async recordSuccessfulTurn(input: SuccessfulTurnLog): Promise<RecordedTurn> {
    return this.insertTurn({
      clientSessionId: clipLoggedText(input.clientSessionId, MAX_SESSION_ID_CHARS),
      brandId: input.brand.id,
      domain: input.brand.domain,
      userMessage: clipLoggedText(input.userMessage, MAX_MESSAGE_LENGTH),
      avaResponse: clipLoggedText(input.avaResponse, MAX_AVA_RESPONSE_CHARS),
      structuredResponse: input.structuredResponse ?? null,
      sources: trustedSourcesForLog(input.sources),
      aiProvider: input.aiProvider,
      aiModel: input.aiModel,
      responseDurationMs: input.responseDurationMs,
      requestStatus: "success",
      errorCode: null,
      searchUsed: input.searchUsed,
      searchIntent: input.searchIntent,
      searchStatus: input.searchStatus,
      searchProvider: input.searchProvider,
      searchResultCount: input.searchResultCount,
    });
  }

  async recordFailedTurn(input: FailedTurnLog): Promise<RecordedTurn> {
    return this.insertTurn({
      clientSessionId: clipLoggedText(input.clientSessionId, MAX_SESSION_ID_CHARS),
      brandId: input.brand.id,
      domain: input.brand.domain,
      userMessage: clipLoggedText(input.userMessage, MAX_MESSAGE_LENGTH),
      avaResponse: null,
      structuredResponse: null,
      sources: [],
      aiProvider: input.aiProvider,
      aiModel: input.aiModel,
      responseDurationMs: input.responseDurationMs,
      requestStatus: "failed",
      errorCode: input.errorCode.slice(0, 64),
      searchUsed: input.searchUsed,
      searchIntent: input.searchIntent,
      searchStatus: input.searchStatus,
      searchProvider: input.searchProvider,
      searchResultCount: input.searchResultCount,
    });
  }

  private async withLock<T>(key: string, work: () => Promise<T> | T): Promise<T> {
    const previous = this.locks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(
      key,
      previous.then(() => gate),
    );
    await previous;
    try {
      return await work();
    } finally {
      release();
    }
  }

  private async insertTurn(input: {
    clientSessionId: string;
    brandId: string;
    domain: string;
    userMessage: string;
    avaResponse: string | null;
    structuredResponse: unknown;
    sources: unknown;
    aiProvider: string;
    aiModel: string | null;
    responseDurationMs: number;
    requestStatus: RequestStatus;
    errorCode: string | null;
    searchUsed: boolean;
    searchIntent: string | null;
    searchStatus: string | null;
    searchProvider: string | null;
    searchResultCount: number;
  }): Promise<RecordedTurn> {
    const key = sessionKey(input.brandId, input.clientSessionId);
    return this.withLock(key, () => {
      const existing = this.sessions.get(key);
      const now = new Date();
      const session: ConversationSessionRecord = existing
        ? {
            ...existing,
            lastActivityAt: now,
            turnCount: existing.turnCount + 1,
            followUpCount: existing.turnCount,
            updatedAt: now,
          }
        : {
            id: randomUUID(),
            clientSessionId: input.clientSessionId,
            brandId: input.brandId,
            domain: input.domain,
            startedAt: now,
            lastActivityAt: now,
            turnCount: 1,
            followUpCount: 0,
            createdAt: now,
            updatedAt: now,
          };

      if (
        this.turns.some(
          (turn) => turn.sessionId === session.id && turn.turnNumber === session.turnCount,
        )
      ) {
        throw new Error("duplicate turn number");
      }

      this.sessions.set(key, session);
      const turn = {
        id: randomUUID(),
        sessionId: session.id,
        turnNumber: session.turnCount,
        userMessage: input.userMessage,
        avaResponse: input.avaResponse,
        structuredResponse: input.structuredResponse,
        aiProvider: input.aiProvider,
        aiModel: input.aiModel,
        responseDurationMs: input.responseDurationMs,
        requestStatus: input.requestStatus,
        errorCode: input.errorCode,
        searchUsed: input.searchUsed,
        searchIntent: input.searchIntent,
        searchStatus: input.searchStatus,
        searchProvider: input.searchProvider,
        searchResultCount: input.searchResultCount,
        sources: input.sources,
        createdAt: now,
      };
      this.turns.push(turn);
      return { session, turn };
    });
  }
}
