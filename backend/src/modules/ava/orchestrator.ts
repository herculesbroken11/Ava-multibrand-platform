import {
  API_ERROR_CODES,
  type ConversationResponse,
} from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import { createId, nowIso } from "../../common/utils/ids";
import { getLlmProvider, isMockAiProvider } from "../ai/get-provider";
import type { LlmProvider } from "../ai/llm-provider";
import { mockConversationProvider } from "../ai/mock-provider";
import type { ConversationProviderInput } from "../ai/provider";
import { getSearchProvider } from "../search/get-search-provider";
import {
  formatRetrievedContext,
  logSearchMetadata,
  mapTrustedSources,
} from "../search/search-context";
import { decideSearch } from "../search/search-decision";
import { buildSearchQuery } from "../search/search-query";
import type {
  RetrievalBundle,
  SearchProvider,
  SearchResult,
} from "../search/search-types";
import type { AvaTurnTelemetry } from "./ava-telemetry";
import { composeAvaSystemPrompt } from "./ava-system-prompt";
import { buildLlmHistory } from "./history";
import { parseAvaModelOutput } from "./output-parser";

export interface AvaTurnOptions {
  search?: SearchProvider;
  searchProviderName?: string;
}

export interface AvaTurnOutcome {
  response: ConversationResponse;
  telemetry: AvaTurnTelemetry;
}

function mockTelemetry(): AvaTurnTelemetry {
  return {
    aiProvider: "mock",
    aiModel: "mock",
    searchUsed: false,
    searchIntent: "none",
    searchStatus: "not_needed",
    searchProvider: null,
    searchResultCount: 0,
    searchDurationMs: null,
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
  };
}

async function retrievePublicInformation(
  input: ConversationProviderInput,
  search: SearchProvider,
  providerName: string,
): Promise<{ bundle: RetrievalBundle; essential: boolean }> {
  const decision = decideSearch(input.messages, input.brand);

  if (!decision.shouldSearch) {
    logSearchMetadata({
      searchUsed: false,
      intent: decision.intent,
      provider: providerName,
      resultCount: 0,
      status: "not_needed",
    });
    return {
      essential: false,
      bundle: { status: "not_needed", intent: decision.intent, results: [] },
    };
  }

  const query = buildSearchQuery({
    messages: input.messages,
    brand: input.brand,
    decision,
  });
  const started = Date.now();
  let results: SearchResult[] = [];
  let status: RetrievalBundle["status"] = "failed";

  try {
    const raw = await search.search({
      query,
      intent: decision.intent,
      maxResults: env.SEARCH_MAX_RESULTS,
      timeoutMs: env.SEARCH_TIMEOUT_MS,
      contextSize: env.SEARCH_CONTEXT_SIZE,
      userLocation: decision.location,
    });
    results = raw.slice(0, env.SEARCH_MAX_RESULTS);
    status = results.length > 0 ? "success" : "no_results";
  } catch (error) {
    if (error instanceof AppError) throw error;
    status = "failed";
    results = [];
  }

  const durationMs = Date.now() - started;
  logSearchMetadata({
    searchUsed: true,
    intent: decision.intent,
    provider: providerName,
    durationMs,
    resultCount: results.length,
    status,
  });

  return {
    essential: decision.essential,
    bundle: {
      status,
      intent: decision.intent,
      query,
      results,
      durationMs,
    },
  };
}

async function executeAvaTurn(
  input: ConversationProviderInput,
  llm: LlmProvider,
  options: AvaTurnOptions = {},
): Promise<AvaTurnOutcome> {
  const search = options.search ?? getSearchProvider();
  const providerName = options.searchProviderName ?? env.SEARCH_PROVIDER;
  const { bundle, essential } = await retrievePublicInformation(input, search, providerName);

  const system = composeAvaSystemPrompt(input.brand, {
    retrievedPublicInformation: formatRetrievedContext(bundle, essential),
  });
  const history = buildLlmHistory(input.messages);

  if (history.length === 0 || history[history.length - 1]?.role !== "user") {
    throw new AppError(
      400,
      API_ERROR_CODES.VALIDATION_ERROR,
      "A non-empty user message is required.",
    );
  }

  const { text, usage } = await llm.complete({
    system,
    messages: history,
    maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
    timeoutMs: env.AI_TIMEOUT_MS,
  });

  let parsed;
  try {
    parsed = parseAvaModelOutput(text);
  } catch {
    throw new AppError(
      502,
      API_ERROR_CODES.PROVIDER_INVALID_RESPONSE,
      "Ava couldn’t reply just then. Please try again.",
    );
  }

  const followUps = parsed.followUps?.slice(0, 3) ?? [];
  const sources = mapTrustedSources(parsed.usedSourceIds, bundle.results);

  return {
    response: {
      message: {
        id: createId("msg"),
        role: "ava",
        content: parsed.content,
        createdAt: nowIso(),
        status: "complete",
        structuredContent: parsed.structuredContent,
        followUps,
        sources: sources.length > 0 ? sources : undefined,
      },
      followUps,
    },
    telemetry: {
      aiProvider: env.AI_PROVIDER,
      aiModel: env.AI_MODEL,
      searchUsed: bundle.status !== "not_needed",
      searchIntent: bundle.intent,
      searchStatus: bundle.status,
      searchProvider: bundle.status === "not_needed" ? null : providerName,
      searchResultCount: bundle.results.length,
      searchDurationMs: bundle.durationMs ?? null,
      promptTokens: usage?.promptTokens ?? null,
      completionTokens: usage?.completionTokens ?? null,
      totalTokens: usage?.totalTokens ?? null,
    },
  };
}

export async function runAvaTurn(
  input: ConversationProviderInput,
  llm: LlmProvider,
  options: AvaTurnOptions = {},
): Promise<ConversationResponse> {
  return (await executeAvaTurn(input, llm, options)).response;
}

export async function respondWithAva(
  input: ConversationProviderInput,
): Promise<AvaTurnOutcome> {
  if (isMockAiProvider()) {
    const response = await mockConversationProvider.complete(input);
    return { response, telemetry: mockTelemetry() };
  }

  return executeAvaTurn(input, getLlmProvider());
}
