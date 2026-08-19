import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { mapLlmProviderError } from "./map-provider-error";

describe("LLM provider error mapping", () => {
  it("maps timeouts without leaking internals", () => {
    const error = mapLlmProviderError(Object.assign(new Error("socket hang"), { name: "TimeoutError" }));
    assert.equal(error.code, API_ERROR_CODES.PROVIDER_TIMEOUT);
    assert.equal(error.message.includes("socket"), false);
  });

  it("maps 429 to a safe busy message", () => {
    const error = mapLlmProviderError({ status: 429, message: "Rate limit for sk-secret" });
    assert.equal(error.code, API_ERROR_CODES.PROVIDER_RATE_LIMIT);
    assert.equal(error.message.includes("sk-"), false);
  });

  it("maps 401 without exposing SDK text", () => {
    const error = mapLlmProviderError({ status: 401, message: "Incorrect API key provided" });
    assert.equal(error.code, API_ERROR_CODES.PROVIDER_AUTH);
    assert.equal(error.message.includes("API key"), false);
  });

  it("passes through AppError", () => {
    const original = new AppError(502, API_ERROR_CODES.PROVIDER_UNAVAILABLE, "Ava couldn’t reply just then. Please try again.");
    const mapped = mapLlmProviderError(original);
    assert.equal(mapped, original);
  });
});
