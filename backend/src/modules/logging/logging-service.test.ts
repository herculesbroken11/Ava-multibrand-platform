import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLoggingService } from "./logging-service";
import type { ConversationLogRepository, SuccessfulTurnLog } from "./logging-types";
import { getBackendBrand } from "../brands/registry";

const resolvedBrand = getBackendBrand("productreviews");
assert.ok(resolvedBrand);
const brand = resolvedBrand;

function sampleSuccess(overrides: Partial<SuccessfulTurnLog> = {}): SuccessfulTurnLog {
  return {
    clientSessionId: "convo_test",
    brand,
    userMessage: "What's the best robot vacuum?",
    avaResponse: "What's your budget, and do you have pets?",
    structuredResponse: undefined,
    sources: undefined,
    aiProvider: "mock",
    aiModel: "mock",
    responseDurationMs: 12,
    searchUsed: false,
    searchIntent: "none",
    searchStatus: "not_needed",
    searchProvider: null,
    searchResultCount: 0,
    ...overrides,
  };
}

describe("logging service", () => {
  it("L: a null repository requires no database and reports not persisted", async () => {
    const logging = createLoggingService(null);
    const result = await logging.recordSuccessfulTurn(sampleSuccess());
    assert.equal(result.persisted, false);
    assert.equal(result.turn, undefined);
  });

  it("J/K: repository failure is contained and does not leak SQL", async () => {
    const repository: ConversationLogRepository = {
      async recordSuccessfulTurn() {
        throw new Error("syntax error at or near SELECT postgresql://secret:pass@host/db");
      },
      async recordFailedTurn() {
        throw new Error("ECONNREFUSED postgresql://secret");
      },
    };
    const logging = createLoggingService(repository);
    const result = await logging.recordSuccessfulTurn(sampleSuccess());
    assert.equal(result.persisted, false);
    assert.equal(JSON.stringify(result).includes("postgresql://"), false);
    assert.equal(JSON.stringify(result).includes("SELECT"), false);
  });
});
