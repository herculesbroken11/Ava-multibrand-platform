import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  API_ERROR_CODES,
  CONVERSATION_MESSAGE_PATH,
} from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { buildApp } from "../../app";
import { sendConversationMessage } from "../conversation/service";
import { assertBrandMatchesOrigin } from "./origin-guard";
import { getBackendBrand } from "./registry";

function conversationBody(brandId: string) {
  return {
    brandId,
    sessionId: `session_${brandId}_${Math.random().toString(16).slice(2)}`,
    messages: [
      {
        id: "msg_user",
        role: "user" as const,
        content: "Hello Ava",
        createdAt: "2026-08-19T00:00:00.000Z",
      },
    ],
  };
}

function mockTurn() {
  return {
    async completeTurn() {
      return {
        response: {
          message: {
            id: "msg_ava",
            role: "ava" as const,
            content: "Hello.",
            createdAt: "2026-08-19T00:00:01.000Z",
            status: "complete" as const,
          },
          followUps: [],
        },
        telemetry: {
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
        },
      };
    },
  };
}

describe("conversation brand origin consistency", () => {
  const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

  after(async () => {
    await Promise.all(apps.map((app) => app.close()));
  });

  it("I: unregistered frontend-supplied brandId is rejected", async () => {
    const app = await buildApp();
    apps.push(app);
    const response = await app.inject({
      method: "POST",
      url: CONVERSATION_MESSAGE_PATH,
      headers: { origin: "http://localhost:3000" },
      payload: conversationBody("not-a-registered-brand"),
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, API_ERROR_CODES.UNKNOWN_BRAND);
  });

  it("J: origin/brand mismatch is rejected", async () => {
    const app = await buildApp();
    apps.push(app);
    const response = await app.inject({
      method: "POST",
      url: CONVERSATION_MESSAGE_PATH,
      headers: { origin: "https://productreviews.com.au" },
      payload: conversationBody("testbrand"),
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, API_ERROR_CODES.BRAND_ORIGIN_MISMATCH);
  });

  it("does not persist a mismatch as a conversation session", async () => {
    await assert.rejects(
      () =>
        sendConversationMessage(conversationBody("testbrand"), {
          origin: "https://productreviews.com.au",
          ...mockTurn(),
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, API_ERROR_CODES.BRAND_ORIGIN_MISMATCH);
        return true;
      },
    );
  });

  it("accepts ProductReviews from its production origin", async () => {
    assert.doesNotThrow(() =>
      assertBrandMatchesOrigin("productreviews", "https://www.productreviews.com.au"),
    );
    const response = await sendConversationMessage(
      conversationBody("productreviews"),
      { origin: "https://productreviews.com.au", ...mockTurn() },
    );
    assert.equal(response.message.role, "ava");
  });

  it("accepts the test fixture brand from its fixture origin", async () => {
    assert.ok(getBackendBrand("testbrand", "test"));
    assert.doesNotThrow(() =>
      assertBrandMatchesOrigin("testbrand", "http://testbrand.local:3000"),
    );
    const response = await sendConversationMessage(conversationBody("testbrand"), {
      origin: "http://testbrand.local:3000",
      ...mockTurn(),
    });
    assert.equal(response.message.role, "ava");
  });

  it("does not allow wildcard CORS", async () => {
    const app = await buildApp();
    apps.push(app);
    const allowed = await app.inject({
      method: "OPTIONS",
      url: CONVERSATION_MESSAGE_PATH,
      headers: {
        origin: "https://productreviews.com.au",
        "access-control-request-method": "POST",
      },
    });
    assert.equal(
      allowed.headers["access-control-allow-origin"],
      "https://productreviews.com.au",
    );

    const denied = await app.inject({
      method: "OPTIONS",
      url: CONVERSATION_MESSAGE_PATH,
      headers: {
        origin: "https://evilproductreviews.com.au",
        "access-control-request-method": "POST",
      },
    });
    assert.notEqual(
      denied.headers["access-control-allow-origin"],
      "https://evilproductreviews.com.au",
    );
    assert.notEqual(denied.headers["access-control-allow-origin"], "*");
  });
});
