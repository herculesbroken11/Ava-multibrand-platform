import type { FastifyInstance } from "fastify";
import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "./app-error";

function publicMessage(error: unknown): { statusCode: number; code: string; message: string } {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  if (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    (error as { statusCode?: number }).statusCode === 429
  ) {
    return {
      statusCode: 429,
      code: API_ERROR_CODES.RATE_LIMITED,
      message: "Ava is getting a lot of questions right now. Please try again in a moment.",
    };
  }

  return {
    statusCode: 500,
    code: API_ERROR_CODES.INTERNAL_ERROR,
    message: "Something went wrong. Please try again.",
  };
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const safe = publicMessage(error);

    if (safe.statusCode >= 500) {
      request.log.error({ err: error, code: safe.code }, "Unhandled request error");
    } else {
      request.log.warn({ code: safe.code, statusCode: safe.statusCode }, "Request rejected");
    }

    return reply.status(safe.statusCode).send({
      error: {
        code: safe.code,
        message: safe.message,
      },
    });
  });
}
