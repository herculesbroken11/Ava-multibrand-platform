import type { FastifyInstance } from "fastify";
import { HEALTH_PATH, type HealthResponse } from "@product-reviews/contracts";
import { env } from "../../config/env";
import { pingDatabase } from "../database/database";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get(HEALTH_PATH, async (): Promise<HealthResponse> => {
    const reachable = env.DATABASE_ENABLED ? await pingDatabase() : false;

    return {
      status: "ok",
      service: "product-reviews-api",
      environment: env.NODE_ENV,
      time: new Date().toISOString(),
      aiProvider: env.AI_PROVIDER,
      searchProvider: env.SEARCH_PROVIDER,
      database: {
        enabled: env.DATABASE_ENABLED,
        reachable,
      },
      rateLimit: {
        enabled: env.RATE_LIMIT_ENABLED,
      },
    };
  });
}
