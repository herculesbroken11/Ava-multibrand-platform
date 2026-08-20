import {
  API_ERROR_CODES,
  MAX_MESSAGE_LENGTH,
  type ConversationMessage,
  type ConversationResponse,
} from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import { latestUserMessageContent } from "../../common/utils/ids";
import type { AvaTurnOutcome } from "../ava/orchestrator";
import { respondWithAva, telemetryFromError } from "../ava/orchestrator";
import { assertBrandMatchesOrigin } from "../brands/origin-guard";
import { getBackendBrand } from "../brands/registry";
import { getLoggingService } from "../logging/get-logging-service";
import type { ConversationLoggingService } from "../logging/logging-types";
import type { ConversationRequestBody } from "./schemas";

export interface ConversationServiceDeps {
  completeTurn?: (input: Parameters<typeof respondWithAva>[0]) => Promise<AvaTurnOutcome>;
  logging?: ConversationLoggingService;
  origin?: string;
}

function assertLatestUserMessage(
  messages: ConversationRequestBody["messages"],
): void {
  const content = latestUserMessageContent(messages);

  if (!content) {
    throw new AppError(
      400,
      API_ERROR_CODES.VALIDATION_ERROR,
      "A non-empty user message is required.",
    );
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new AppError(
      400,
      API_ERROR_CODES.VALIDATION_ERROR,
      `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    );
  }
}

function shouldLogFailedTurn(error: unknown): boolean {
  if (!(error instanceof AppError)) return true;
  return (
    error.code !== API_ERROR_CODES.VALIDATION_ERROR &&
    error.code !== API_ERROR_CODES.UNKNOWN_BRAND &&
    error.code !== API_ERROR_CODES.BRAND_ORIGIN_MISMATCH &&
    error.code !== API_ERROR_CODES.RATE_LIMITED
  );
}

function errorCodeOf(error: unknown): string {
  if (error instanceof AppError) return error.code;
  return API_ERROR_CODES.INTERNAL_ERROR;
}

/**
 * Duration is milliseconds from after request validation until the validated
 * Ava response is ready. Persistence time is not included.
 */
export async function sendConversationMessage(
  input: ConversationRequestBody,
  deps: ConversationServiceDeps = {},
): Promise<ConversationResponse> {
  const brand = getBackendBrand(input.brandId);

  if (!brand) {
    throw new AppError(
      400,
      API_ERROR_CODES.UNKNOWN_BRAND,
      "That brand is not available.",
    );
  }

  assertBrandMatchesOrigin(brand.id, deps.origin);
  assertLatestUserMessage(input.messages);

  const logging = deps.logging ?? getLoggingService();
  const completeTurn = deps.completeTurn ?? respondWithAva;
  const userMessage = latestUserMessageContent(input.messages);
  const started = Date.now();

  try {
    const outcome = await completeTurn({
      brand,
      sessionId: input.sessionId,
      messages: input.messages as ConversationMessage[],
    });
    const responseDurationMs = Date.now() - started;

    await logging.recordSuccessfulTurn({
      clientSessionId: input.sessionId,
      brand,
      userMessage,
      avaResponse: outcome.response.message.content,
      structuredResponse: outcome.response.message.structuredContent,
      sources: outcome.response.message.sources,
      aiProvider: outcome.telemetry.aiProvider,
      aiModel: outcome.telemetry.aiModel,
      responseDurationMs,
      searchUsed: outcome.telemetry.searchUsed,
      searchIntent: outcome.telemetry.searchIntent,
      searchStatus: outcome.telemetry.searchStatus,
      searchProvider: outcome.telemetry.searchProvider,
      searchResultCount: outcome.telemetry.searchResultCount,
      searchDurationMs: outcome.telemetry.searchDurationMs,
      promptTokens: outcome.telemetry.promptTokens,
      completionTokens: outcome.telemetry.completionTokens,
      totalTokens: outcome.telemetry.totalTokens,
    });

    return outcome.response;
  } catch (error) {
    const responseDurationMs = Date.now() - started;

    if (shouldLogFailedTurn(error)) {
      const search = telemetryFromError(error);
      await logging.recordFailedTurn({
        clientSessionId: input.sessionId,
        brand,
        userMessage,
        aiProvider: search?.aiProvider ?? env.AI_PROVIDER,
        aiModel: search?.aiModel ?? (env.AI_PROVIDER === "mock" ? "mock" : env.AI_MODEL),
        responseDurationMs,
        errorCode: errorCodeOf(error),
        searchUsed: search?.searchUsed ?? false,
        searchIntent: search?.searchIntent ?? null,
        searchStatus: search?.searchStatus ?? null,
        searchProvider: search?.searchProvider ?? null,
        searchResultCount: search?.searchResultCount ?? 0,
        searchDurationMs: search?.searchDurationMs ?? null,
      });
    }

    throw error;
  }
}
