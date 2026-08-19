import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { API_ERROR_CODES } from "@product-reviews/contracts";
import { env } from "../../config/env";

export interface RateLimitSettings {
  enabled: boolean;
  max: number;
  windowMs: number;
}

export function getRateLimitSettings(): RateLimitSettings {
  return {
    enabled: env.RATE_LIMIT_ENABLED,
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  };
}

export async function registerRateLimit(
  app: FastifyInstance,
  settings: RateLimitSettings = getRateLimitSettings(),
): Promise<void> {
  if (!settings.enabled) return;

  await app.register(rateLimit, {
    global: false,
    max: settings.max,
    timeWindow: settings.windowMs,
    hook: "onRequest",
    skipOnError: true,
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: {
        code: API_ERROR_CODES.RATE_LIMITED,
        message: "Ava is getting a lot of questions right now. Please try again in a moment.",
      },
    }),
  });
}

export function conversationRateLimitConfig(settings: RateLimitSettings = getRateLimitSettings()) {
  if (!settings.enabled) return undefined;
  return {
    rateLimit: {
      max: settings.max,
      timeWindow: settings.windowMs,
    },
  };
}
