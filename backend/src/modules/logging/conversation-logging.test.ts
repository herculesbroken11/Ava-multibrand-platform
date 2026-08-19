import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { sendConversationMessage } from "../conversation/service";
import { getBackendBrand } from "../brands/registry";
import { createLoggingService } from "./logging-service";
import { MemoryConversationRepository } from "./memory-conversation-repository";
import type { ConversationLogRepository } from "./logging-types";

const brand = getBackendBrand("productreviews");
assert.ok(brand);

function userRequest(sessionId: string, content: string, brandId = "productreviews") {
  return {
    brandId,
    sessionId,
    messages: [
      {
        id: "msg_user",
        role: "user" as const,
        content,
        createdAt: "2026-08-19T00:00:00.000Z",
      },
    ],
  };
}

function avaOutcome(content: string, extras?: {
  sources?: Array<{ title: string; domain: string; url: string; date?: string }>;
  structuredContent?: Array<{ type: "paragraph"; text: string }>;
  telemetry?: Partial<{
    aiProvider: string;
    aiModel: string | null;
    searchUsed: boolean;
    searchIntent: string | null;
    searchStatus: string | null;
    searchProvider: string | null;
    searchResultCount: number;
    searchDurationMs: number | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  }>;
}) {
  return {
    response: {
      message: {
        id: "msg_ava",
        role: "ava" as const,
        content,
        createdAt: "2026-08-19T00:00:01.000Z",
        status: "complete" as const,
        structuredContent: extras?.structuredContent,
        sources: extras?.sources,
      },
      followUps: [],
    },
    telemetry: {
      aiProvider: "openai",
      aiModel: "gpt-4o-mini",
      searchUsed: false,
      searchIntent: "none",
      searchStatus: "not_needed",
      searchProvider: null,
      searchResultCount: 0,
      searchDurationMs: null,
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      ...extras?.telemetry,
    },
  };
}

describe("anonymous conversation logging", () => {
  it("A: first successful question creates one session and turn 1", async () => {
    const repo = new MemoryConversationRepository();
    await sendConversationMessage(userRequest("convo_a", "What's the best robot vacuum?"), {
      logging: createLoggingService(repo),
      completeTurn: async () => avaOutcome("What's your budget, and do you have pets?"),
    });

    assert.equal(repo.sessions.size, 1);
    assert.equal(repo.turns.length, 1);
    assert.equal(repo.turns[0]?.turnNumber, 1);
    assert.equal(repo.turns[0]?.requestStatus, "success");
  });

  it("B: the same client session reuses the row and creates turn 2", async () => {
    const repo = new MemoryConversationRepository();
    const logging = createLoggingService(repo);
    const completeTurn = async () => avaOutcome("Noted.");

    await sendConversationMessage(userRequest("convo_b", "First question"), {
      logging,
      completeTurn,
    });
    await sendConversationMessage(userRequest("convo_b", "Follow-up"), {
      logging,
      completeTurn,
    });

    const session = [...repo.sessions.values()][0];
    assert.equal(repo.sessions.size, 1);
    assert.equal(session?.turnCount, 2);
    assert.deepEqual(
      repo.turns.map((turn) => turn.turnNumber),
      [1, 2],
    );
  });

  it("C: follow_up_count ignores the initial question", async () => {
    const repo = new MemoryConversationRepository();
    const logging = createLoggingService(repo);
    const completeTurn = async () => avaOutcome("Noted.");

    await sendConversationMessage(userRequest("convo_c", "First"), { logging, completeTurn });
    assert.equal([...repo.sessions.values()][0]?.followUpCount, 0);

    await sendConversationMessage(userRequest("convo_c", "Second"), { logging, completeTurn });
    assert.equal([...repo.sessions.values()][0]?.followUpCount, 1);
  });

  it("D: a different client session creates a different database session", async () => {
    const repo = new MemoryConversationRepository();
    const logging = createLoggingService(repo);
    const completeTurn = async () => avaOutcome("Noted.");

    await sendConversationMessage(userRequest("convo_d1", "One"), { logging, completeTurn });
    await sendConversationMessage(userRequest("convo_d2", "Two"), { logging, completeTurn });

    assert.equal(repo.sessions.size, 2);
  });

  it("E: different brand IDs do not collide on the same client session id", async () => {
    const repo = new MemoryConversationRepository();
    const other = { ...brand, id: "otherbrand", domain: "other.example" };
    await repo.recordSuccessfulTurn({
      clientSessionId: "shared",
      brand,
      userMessage: "Hello",
      avaResponse: "Hi",
      structuredResponse: undefined,
      sources: undefined,
      aiProvider: "mock",
      aiModel: "mock",
      responseDurationMs: 1,
      searchUsed: false,
      searchIntent: null,
      searchStatus: null,
      searchProvider: null,
      searchResultCount: 0,
    });
    await repo.recordSuccessfulTurn({
      clientSessionId: "shared",
      brand: other,
      userMessage: "Hello",
      avaResponse: "Hi",
      structuredResponse: undefined,
      sources: undefined,
      aiProvider: "mock",
      aiModel: "mock",
      responseDurationMs: 1,
      searchUsed: false,
      searchIntent: null,
      searchStatus: null,
      searchProvider: null,
      searchResultCount: 0,
    });
    assert.equal(repo.sessions.size, 2);
  });

  it("F: successful Ava responses store provider, model, and duration", async () => {
    const repo = new MemoryConversationRepository();
    await sendConversationMessage(userRequest("convo_f", "Hello"), {
      logging: createLoggingService(repo),
      completeTurn: async () => avaOutcome("Hi from Ava."),
    });
    const turn = repo.turns[0];
    assert.equal(turn?.aiProvider, "openai");
    assert.equal(turn?.aiModel, "gpt-4o-mini");
    assert.equal(typeof turn?.responseDurationMs, "number");
    assert.ok((turn?.responseDurationMs ?? -1) >= 0);
  });

  it("G: search-used turns store metadata and validated sources", async () => {
    const repo = new MemoryConversationRepository();
    await sendConversationMessage(userRequest("convo_g", "How much is the Dyson today?"), {
      logging: createLoggingService(repo),
      completeTurn: async () =>
        avaOutcome("I found an observed AUD listing.", {
          sources: [
            {
              title: "Harvey Norman listing",
              domain: "harveynorman.com.au",
              url: "https://www.harveynorman.com.au/example-dyson",
            },
          ],
          telemetry: {
            searchUsed: true,
            searchIntent: "current_price",
            searchStatus: "success",
            searchProvider: "mock",
            searchResultCount: 1,
          },
        }),
    });
    const turn = repo.turns[0];
    assert.equal(turn?.searchUsed, true);
    assert.equal(turn?.searchIntent, "current_price");
    assert.equal(turn?.searchStatus, "success");
    assert.equal(turn?.searchProvider, "mock");
    assert.equal(turn?.searchResultCount, 1);
    assert.deepEqual(turn?.sources, [
      {
        title: "Harvey Norman listing",
        domain: "harveynorman.com.au",
        url: "https://www.harveynorman.com.au/example-dyson",
      },
    ]);
  });

  it("stores token metadata and search duration on successful turns", async () => {
    const repo = new MemoryConversationRepository();
    await sendConversationMessage(userRequest("convo_tokens", "How much is it today?"), {
      logging: createLoggingService(repo),
      completeTurn: async () =>
        avaOutcome("I found an observed listing.", {
          telemetry: {
            searchUsed: true,
            searchDurationMs: 812,
            promptTokens: 120,
            completionTokens: 40,
            totalTokens: 160,
          },
        }),
    });
    const turn = repo.turns[0];
    assert.equal(turn?.promptTokens, 120);
    assert.equal(turn?.completionTokens, 40);
    assert.equal(turn?.totalTokens, 160);
    assert.equal(turn?.searchDurationMs, 812);
  });

  it("H: model-invented URLs are not stored", async () => {
    const repo = new MemoryConversationRepository();
    await sendConversationMessage(userRequest("convo_h", "How much is it today?"), {
      logging: createLoggingService(repo),
      completeTurn: async () =>
        avaOutcome("I found a listing.", {
          sources: [
            {
              title: "Trusted",
              domain: "dyson.com.au",
              url: "https://www.dyson.com.au/vacuum-cleaners",
            },
          ],
        }),
    });
    assert.equal(JSON.stringify(repo.turns).includes("invented-example.com"), false);
    const sources = repo.turns[0]?.sources as Array<{ url: string }>;
    assert.equal(sources.some((source) => source.url.includes("invented-example.com")), false);
  });

  it("I: AI/provider failure records a safe failed turn", async () => {
    const repo = new MemoryConversationRepository();
    await assert.rejects(
      () =>
        sendConversationMessage(userRequest("convo_i", "Hello"), {
          logging: createLoggingService(repo),
          completeTurn: async () => {
            throw new AppError(
              504,
              API_ERROR_CODES.PROVIDER_TIMEOUT,
              "Ava took too long to reply. Please try again.",
            );
          },
        }),
      (error: unknown) => error instanceof AppError && error.code === API_ERROR_CODES.PROVIDER_TIMEOUT,
    );

    assert.equal(repo.turns[0]?.requestStatus, "failed");
    assert.equal(repo.turns[0]?.errorCode, API_ERROR_CODES.PROVIDER_TIMEOUT);
    assert.equal(repo.turns[0]?.avaResponse, null);
  });

  it("J: database failure after a successful Ava reply still returns the reply", async () => {
    const repository: ConversationLogRepository = {
      async recordSuccessfulTurn() {
        throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
      },
      async recordFailedTurn() {
        throw new Error("connect ECONNREFUSED");
      },
    };

    const response = await sendConversationMessage(userRequest("convo_j", "Hello"), {
      logging: createLoggingService(repository),
      completeTurn: async () => avaOutcome("Valid Ava reply."),
    });

    assert.equal(response.message.content, "Valid Ava reply.");
  });

  it("K: database failure does not leak SQL or connection details to the caller", async () => {
    const repository: ConversationLogRepository = {
      async recordSuccessfulTurn() {
        throw new Error("syntax error at or near SELECT postgresql://ava:secret@localhost/db");
      },
      async recordFailedTurn() {
        throw new Error("postgresql://secret");
      },
    };

    const response = await sendConversationMessage(userRequest("convo_k", "Hello"), {
      logging: createLoggingService(repository),
      completeTurn: async () => avaOutcome("Valid Ava reply."),
    });
    const serialized = JSON.stringify(response);
    assert.equal(serialized.includes("SELECT"), false);
    assert.equal(serialized.includes("postgresql://"), false);
    assert.equal(serialized.includes("secret"), false);
  });

  it("N: concurrent turns cannot produce duplicate turn numbers", async () => {
    const repo = new MemoryConversationRepository();
    const logging = createLoggingService(repo);
    const completeTurn = async () => avaOutcome("Noted.");

    await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        sendConversationMessage(userRequest("convo_n", `Question ${index}`), {
          logging,
          completeTurn,
        }),
      ),
    );

    const numbers = repo.turns.map((turn) => turn.turnNumber).sort((a, b) => a - b);
    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal([...repo.sessions.values()][0]?.turnCount, 8);
  });
});
