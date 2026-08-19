import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyticsPayloadContainsForbidden,
  isGa4MeasurementId,
  isGtmContainerId,
  sanitizeAnalyticsParams,
} from "@product-reviews/contracts";

describe("analytics sanitizer", () => {
  it("keeps behavioural parameters", () => {
    const cleaned = sanitizeAnalyticsParams({
      brand_id: "productreviews",
      entry: "composer",
      result: "success",
      is_follow_up: true,
      has_sources: false,
    });
    assert.deepEqual(cleaned, {
      brand_id: "productreviews",
      entry: "composer",
      result: "success",
      is_follow_up: true,
      has_sources: false,
    });
  });

  it("strips question, answer, session, and source fields", () => {
    const question = "What's the best robot vacuum for pets?";
    const answer = "I'd look at a sealed-path robot with a self-empty dock.";
    const cleaned = sanitizeAnalyticsParams({
      brand_id: "productreviews",
      question,
      answer,
      content: answer,
      message: question,
      text: question,
      prompt: question,
      query: question,
      q: question,
      url: "https://example.com/secret",
      sources: "https://example.com/secret",
      user_message: question,
      ava_response: answer,
      session_id: "convo_secret",
      sessionId: "convo_secret",
      client_session_id: "convo_secret",
    });

    assert.deepEqual(cleaned, { brand_id: "productreviews" });
    const serialized = JSON.stringify(cleaned);
    assert.equal(serialized.includes("robot vacuum"), false);
    assert.equal(serialized.includes("self-empty"), false);
    assert.equal(serialized.includes("convo_secret"), false);
    assert.equal(serialized.includes("example.com"), false);
  });

  it("reports forbidden keys before sanitizing", () => {
    assert.equal(
      analyticsPayloadContainsForbidden({ question: "secret", brand_id: "productreviews" }),
      true,
    );
    assert.equal(analyticsPayloadContainsForbidden({ brand_id: "productreviews" }), false);
  });

  it("accepts only well-formed GA4 and GTM IDs", () => {
    assert.equal(isGa4MeasurementId("G-ABC123"), true);
    assert.equal(isGa4MeasurementId("UA-123"), false);
    assert.equal(isGa4MeasurementId(""), false);
    assert.equal(isGtmContainerId("GTM-ABC123"), true);
    assert.equal(isGtmContainerId("G-ABC123"), false);
  });
});
