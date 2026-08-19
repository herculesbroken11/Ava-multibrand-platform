import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import Fastify from "fastify";
import {
  API_ERROR_CODES,
  CONVERSATION_MESSAGE_PATH,
  HEALTH_PATH,
} from "@product-reviews/contracts";
import {
  conversationRateLimitConfig,
  registerRateLimit,
  type RateLimitSettings,
} from "./rate-limit";

const tightLimit: RateLimitSettings = {
  enabled: true,
  max: 2,
  windowMs: 60_000,
};

async function buildLimitedApp(options: {
  settings?: RateLimitSettings;
  trustProxy?: boolean;
}) {
  const settings = options.settings ?? tightLimit;
  const app = Fastify({
    trustProxy: options.trustProxy ?? false,
    logger: false,
  });
  await registerRateLimit(app, settings);
  const rateLimitConfig = conversationRateLimitConfig(settings);

  app.get(HEALTH_PATH, async () => ({ status: "ok" }));
  app.post(
    CONVERSATION_MESSAGE_PATH,
    rateLimitConfig ? { config: rateLimitConfig } : {},
    async () => ({ ok: true }),
  );

  return app;
}

describe("conversation rate limit", () => {
  const apps: ReturnType<typeof Fastify>[] = [];

  after(async () => {
    await Promise.all(apps.map((app) => app.close()));
  });

  it("returns 429 RATE_LIMITED on the third conversation request", async () => {
    const app = await buildLimitedApp({});
    apps.push(app);

    const first = await app.inject({ method: "POST", url: CONVERSATION_MESSAGE_PATH });
    const second = await app.inject({ method: "POST", url: CONVERSATION_MESSAGE_PATH });
    const third = await app.inject({ method: "POST", url: CONVERSATION_MESSAGE_PATH });

    assert.equal(first.statusCode, 200);
    assert.equal(second.statusCode, 200);
    assert.equal(third.statusCode, 429);
    const body = third.json() as { error?: { code?: string; message?: string } };
    assert.equal(body.error?.code, API_ERROR_CODES.RATE_LIMITED);
    assert.equal(typeof body.error?.message, "string");
    assert.equal(JSON.stringify(body).includes("What's the best"), false);
    assert.equal(JSON.stringify(body).includes("user_message"), false);
  });

  it("does not rate-limit health", async () => {
    const app = await buildLimitedApp({
      settings: { enabled: true, max: 1, windowMs: 60_000 },
    });
    apps.push(app);

    for (let index = 0; index < 5; index += 1) {
      const response = await app.inject({ method: "GET", url: HEALTH_PATH });
      assert.equal(response.statusCode, 200);
    }
  });

  it("does not limit conversation traffic when disabled", async () => {
    const app = await buildLimitedApp({
      settings: { enabled: false, max: 1, windowMs: 60_000 },
    });
    apps.push(app);

    for (let index = 0; index < 5; index += 1) {
      const response = await app.inject({ method: "POST", url: CONVERSATION_MESSAGE_PATH });
      assert.equal(response.statusCode, 200);
    }
  });

  it("ignores X-Forwarded-For when TRUST_PROXY is false", async () => {
    const app = await buildLimitedApp({ trustProxy: false });
    apps.push(app);

    await app.inject({
      method: "POST",
      url: CONVERSATION_MESSAGE_PATH,
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    await app.inject({
      method: "POST",
      url: CONVERSATION_MESSAGE_PATH,
      headers: { "x-forwarded-for": "203.0.113.11" },
    });
    const third = await app.inject({
      method: "POST",
      url: CONVERSATION_MESSAGE_PATH,
      headers: { "x-forwarded-for": "203.0.113.12" },
    });
    assert.equal(third.statusCode, 429);
  });

  it("uses X-Forwarded-For as the client IP when TRUST_PROXY is true", async () => {
    const app = await buildLimitedApp({ trustProxy: true });
    apps.push(app);

    const first = await app.inject({
      method: "POST",
      url: CONVERSATION_MESSAGE_PATH,
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    const second = await app.inject({
      method: "POST",
      url: CONVERSATION_MESSAGE_PATH,
      headers: { "x-forwarded-for": "203.0.113.11" },
    });
    const third = await app.inject({
      method: "POST",
      url: CONVERSATION_MESSAGE_PATH,
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    assert.equal(first.statusCode, 200);
    assert.equal(second.statusCode, 200);
    assert.equal(third.statusCode, 200);
  });
});
