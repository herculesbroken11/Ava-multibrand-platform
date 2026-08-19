import { env } from "../config/env";
import { createConcurrencyGate } from "./concurrency";

export const aiConcurrencyGate = createConcurrencyGate(env.AI_MAX_CONCURRENT_REQUESTS);
export const searchConcurrencyGate = createConcurrencyGate(
  env.SEARCH_MAX_CONCURRENT_REQUESTS,
);
