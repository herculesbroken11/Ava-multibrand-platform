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
      request.log.error({ err: error }, "Unhandled request error");
    } else {
      request.log.warn({ err: error, code: safe.code }, "Request rejected");
    }

    return reply.status(safe.statusCode).send({
      error: {
        code: safe.code,
        message: safe.message,
      },
    });
  });
}
