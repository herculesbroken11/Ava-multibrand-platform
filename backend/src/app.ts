import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { registerErrorHandler } from "./common/errors/error-handler";
import { registerRateLimit } from "./common/middleware/rate-limit";
import { closePool } from "./modules/database/database";
import { registerConversationRoutes } from "./modules/conversation/routes";
import { registerHealthRoutes } from "./modules/health/routes";

export async function buildApp() {
  const app = Fastify({
    trustProxy: env.TRUST_PROXY,
    disableRequestLogging: true,
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
          };
        },
        res(reply) {
          return {
            statusCode: reply.statusCode,
          };
        },
      },
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

  await registerRateLimit(app);
  registerErrorHandler(app);

  await app.register(registerHealthRoutes);
  await app.register(registerConversationRoutes);

  app.addHook("onResponse", (request, reply, done) => {
    request.log.info({
      type: "http",
      method: request.method,
      url: request.routeOptions.url ?? request.url,
      statusCode: reply.statusCode,
      durationMs: reply.elapsedTime,
    });
    done();
  });

  app.addHook("onClose", async () => {
    await closePool();
  });

  return app;
}
