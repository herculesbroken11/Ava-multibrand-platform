import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import type { LlmProvider } from "./llm-provider";
import { createOpenAiProvider } from "./openai-provider";

export function isMockAiProvider(): boolean {
  return env.AI_PROVIDER === "mock";
}

export function getLlmProvider(): LlmProvider {
  if (env.AI_PROVIDER === "mock") {
    throw new AppError(
      500,
      API_ERROR_CODES.INTERNAL_ERROR,
      "Ava couldn’t reply just then. Please try again.",
    );
  }

  if (env.AI_PROVIDER === "openai") {
    return createOpenAiProvider();
  }

  throw new AppError(
    500,
    API_ERROR_CODES.INTERNAL_ERROR,
    "Ava couldn’t reply just then. Please try again.",
  );
}
