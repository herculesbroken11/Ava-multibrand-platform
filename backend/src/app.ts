import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { registerErrorHandler } from "./common/errors/error-handler";
import { closePool } from "./modules/database/database";
import { registerConversationRoutes } from "./modules/conversation/routes";
import { registerHealthRoutes } from "./modules/health/routes";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
    bodyLimit: env.BODY_LIMIT_BYTES,
    requestTimeout: env.REQUEST_TIMEOUT_MS,
    connectionTimeout: env.REQUEST_TIMEOUT_MS,
  });

  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    maxAge: 600,
  });

  // Rate limiting is reserved for a later step. See common/middleware/rate-limit.ts.

  registerErrorHandler(app);

  await app.register(registerHealthRoutes);
  await app.register(registerConversationRoutes);

  app.addHook("onClose", async () => {
    await closePool();
  });

  return app;
}
