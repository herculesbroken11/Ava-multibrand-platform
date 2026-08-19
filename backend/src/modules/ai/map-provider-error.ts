import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";

function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof error.status === "number") return error.status;
  return undefined;
}

function nameOf(error: unknown): string {
  if (error instanceof Error) return error.name;
  return "";
}

export function mapLlmProviderError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const status = statusOf(error);
  const name = nameOf(error);
  const timedOut =
    name.includes("Timeout") ||
    (error instanceof Error && /timeout/i.test(error.message));

  if (timedOut) {
    return new AppError(
      504,
      API_ERROR_CODES.PROVIDER_TIMEOUT,
      "Ava took too long to reply. Please try again.",
    );
  }

  if (status === 401 || status === 403) {
    return new AppError(
      502,
      API_ERROR_CODES.PROVIDER_AUTH,
      "Ava couldn’t reply just then. Please try again.",
    );
  }

  if (status === 429) {
    return new AppError(
      429,
      API_ERROR_CODES.PROVIDER_RATE_LIMIT,
      "Ava is busy right now. Please try again in a moment.",
    );
  }

  if (status && status >= 500) {
    return new AppError(
      502,
      API_ERROR_CODES.PROVIDER_UNAVAILABLE,
      "Ava couldn’t reply just then. Please try again.",
    );
  }

  return new AppError(
    502,
    API_ERROR_CODES.PROVIDER_UNAVAILABLE,
    "Ava couldn’t reply just then. Please try again.",
  );
}
