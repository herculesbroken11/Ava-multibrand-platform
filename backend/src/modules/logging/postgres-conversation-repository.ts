import { MAX_MESSAGE_LENGTH } from "@product-reviews/contracts";
import type { SourceReference } from "@product-reviews/contracts";
import type pg from "pg";
import type {
  ConversationSessionRecord,
  ConversationTurnRecord,
  RecordedTurn,
  RequestStatus,
} from "../database/database-types";
import type {
  ConversationLogRepository,
  FailedTurnLog,
  SuccessfulTurnLog,
} from "./logging-types";

const MAX_AVA_RESPONSE_CHARS = 4_000;
const MAX_SESSION_ID_CHARS = 128;

export function clipLoggedText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

export function trustedSourcesForLog(
  sources: SourceReference[] | undefined,
): Array<{ title: string; domain: string; url: string; date?: string }> {
  if (!sources?.length) return [];
  return sources
    .filter((source) => /^https?:\/\//i.test(source.url))
    .map((source) => ({
      title: source.title,
      domain: source.domain,
      url: source.url,
      ...(source.date ? { date: source.date } : {}),
    }));
}

interface SessionRow {
  id: string;
  client_session_id: string;
  brand_id: string;
  domain: string;
  started_at: Date;
  last_activity_at: Date;
  turn_count: number;
  follow_up_count: number;
  created_at: Date;
  updated_at: Date;
}

interface TurnRow {
  id: string;
  session_id: string;
  turn_number: number;
  user_message: string;
  ava_response: string | null;
  structured_response: unknown | null;
  ai_provider: string;
  ai_model: string | null;
  response_duration_ms: number | null;
  request_status: RequestStatus;
  error_code: string | null;
  search_used: boolean;
  search_intent: string | null;
  search_status: string | null;
  search_provider: string | null;
  search_result_count: number;
  search_duration_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  sources: unknown;
  created_at: Date;
}

function mapSession(row: SessionRow): ConversationSessionRecord {
  return {
    id: row.id,
    clientSessionId: row.client_session_id,
    brandId: row.brand_id,
    domain: row.domain,
    startedAt: row.started_at,
    lastActivityAt: row.last_activity_at,
    turnCount: row.turn_count,
    followUpCount: row.follow_up_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTurn(row: TurnRow): ConversationTurnRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    turnNumber: row.turn_number,
    userMessage: row.user_message,
    avaResponse: row.ava_response,
    structuredResponse: row.structured_response,
    aiProvider: row.ai_provider,
    aiModel: row.ai_model,
    responseDurationMs: row.response_duration_ms,
    requestStatus: row.request_status,
    errorCode: row.error_code,
    searchUsed: row.search_used,
    searchIntent: row.search_intent,
    searchStatus: row.search_status,
    searchProvider: row.search_provider,
    searchResultCount: row.search_result_count,
    searchDurationMs: row.search_duration_ms,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    sources: row.sources,
    createdAt: row.created_at,
  };
}

export class PostgresConversationRepository implements ConversationLogRepository {
  constructor(private readonly pool: pg.Pool) {}

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
      searchDurationMs: input.searchDurationMs ?? null,
      promptTokens: input.promptTokens ?? null,
      completionTokens: input.completionTokens ?? null,
      totalTokens: input.totalTokens ?? null,
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
      searchDurationMs: input.searchDurationMs ?? null,
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    });
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
    searchDurationMs: number | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  }): Promise<RecordedTurn> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `
        INSERT INTO conversation_sessions (
          client_session_id, brand_id, domain, started_at, last_activity_at,
          turn_count, follow_up_count, created_at, updated_at
        )
        VALUES ($1, $2, $3, now(), now(), 0, 0, now(), now())
        ON CONFLICT (brand_id, client_session_id) DO NOTHING
        `,
        [input.clientSessionId, input.brandId, input.domain],
      );

      const sessionResult = await client.query<SessionRow>(
        `
        SELECT id, client_session_id, brand_id, domain, started_at, last_activity_at,
               turn_count, follow_up_count, created_at, updated_at
        FROM conversation_sessions
        WHERE brand_id = $1 AND client_session_id = $2
        FOR UPDATE
        `,
        [input.brandId, input.clientSessionId],
      );
      const locked = sessionResult.rows[0];
      if (!locked) {
        throw new Error("Conversation session could not be created");
      }

      const updatedSession = await client.query<SessionRow>(
        `
        UPDATE conversation_sessions
        SET
          turn_count = turn_count + 1,
          follow_up_count = turn_count,
          last_activity_at = now(),
          updated_at = now()
        WHERE id = $1
        RETURNING id, client_session_id, brand_id, domain, started_at, last_activity_at,
                  turn_count, follow_up_count, created_at, updated_at
        `,
        [locked.id],
      );
      const session = updatedSession.rows[0];
      if (!session) {
        throw new Error("Conversation session could not be updated");
      }

      const turnResult = await client.query<TurnRow>(
        `
        INSERT INTO conversation_turns (
          session_id, turn_number, user_message, ava_response, structured_response,
          ai_provider, ai_model, response_duration_ms, request_status, error_code,
          search_used, search_intent, search_status, search_provider, search_result_count,
          search_duration_ms, prompt_tokens, completion_tokens, total_tokens,
          sources, created_at
        )
        VALUES (
          $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::jsonb, now()
        )
        RETURNING
          id, session_id, turn_number, user_message, ava_response, structured_response,
          ai_provider, ai_model, response_duration_ms, request_status, error_code,
          search_used, search_intent, search_status, search_provider, search_result_count,
          search_duration_ms, prompt_tokens, completion_tokens, total_tokens,
          sources, created_at
        `,
        [
          session.id,
          session.turn_count,
          input.userMessage,
          input.avaResponse,
          input.structuredResponse === null ? null : JSON.stringify(input.structuredResponse),
          input.aiProvider,
          input.aiModel,
          input.responseDurationMs,
          input.requestStatus,
          input.errorCode,
          input.searchUsed,
          input.searchIntent,
          input.searchStatus,
          input.searchProvider,
          input.searchResultCount,
          input.searchDurationMs,
          input.promptTokens,
          input.completionTokens,
          input.totalTokens,
          JSON.stringify(input.sources),
        ],
      );
      const turn = turnResult.rows[0];
      if (!turn) {
        throw new Error("Conversation turn could not be recorded");
      }

      await client.query("COMMIT");
      return { session: mapSession(session), turn: mapTurn(turn) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
