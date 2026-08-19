import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "./errors/app-error";

export function createConcurrencyGate(max: number) {
  let active = 0;

  return {
    get active(): number {
      return active;
    },
    async run<T>(work: () => Promise<T>): Promise<T> {
      if (active >= max) {
        throw new AppError(
          429,
          API_ERROR_CODES.CAPACITY_LIMITED,
          "Ava is busy right now. Please try again in a moment.",
        );
      }

      active += 1;
      try {
        return await work();
      } finally {
        active -= 1;
      }
    },
  };
}
