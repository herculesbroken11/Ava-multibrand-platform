import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import { createMockSearchProvider } from "./mock-search-provider";
import { createOpenAiWebSearchProvider } from "./openai-web-search-provider";
import type { SearchProvider } from "./search-types";

export function getSearchProvider(): SearchProvider {
  if (env.SEARCH_PROVIDER === "mock") {
    return createMockSearchProvider();
  }

  if (env.SEARCH_PROVIDER === "openai") {
    if (!env.AI_API_KEY?.trim()) {
      throw new AppError(
        500,
        API_ERROR_CODES.INTERNAL_ERROR,
        "Ava couldn’t reply just then. Please try again.",
      );
    }
    return createOpenAiWebSearchProvider();
  }

  throw new AppError(
    500,
    API_ERROR_CODES.INTERNAL_ERROR,
    "Ava couldn’t reply just then. Please try again.",
  );
}
