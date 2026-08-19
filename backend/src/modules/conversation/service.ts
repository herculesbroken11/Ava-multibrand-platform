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
import { respondWithAva } from "../ava/orchestrator";
import { getBackendBrand } from "../brands/registry";
import { getLoggingService } from "../logging/get-logging-service";
import type { ConversationLoggingService } from "../logging/logging-types";
import type { ConversationRequestBody } from "./schemas";

export interface ConversationServiceDeps {
  completeTurn?: (input: Parameters<typeof respondWithAva>[0]) => Promise<AvaTurnOutcome>;
  logging?: ConversationLoggingService;
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
    error.code !== API_ERROR_CODES.UNKNOWN_BRAND
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
    });

    return outcome.response;
  } catch (error) {
    const responseDurationMs = Date.now() - started;

    if (shouldLogFailedTurn(error)) {
      await logging.recordFailedTurn({
        clientSessionId: input.sessionId,
        brand,
        userMessage,
        aiProvider: env.AI_PROVIDER,
        aiModel: env.AI_PROVIDER === "mock" ? "mock" : env.AI_MODEL,
        responseDurationMs,
        errorCode: errorCodeOf(error),
        searchUsed: false,
        searchIntent: null,
        searchStatus: null,
        searchProvider: null,
        searchResultCount: 0,
      });
    }

    throw error;
  }
}
