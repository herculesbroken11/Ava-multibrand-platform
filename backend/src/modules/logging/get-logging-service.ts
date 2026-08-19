import { env } from "../../config/env";
import { getPool, isDatabaseEnabled } from "../database/database";
import { createLoggingService } from "./logging-service";
import type { ConversationLoggingService } from "./logging-types";
import { PostgresConversationRepository } from "./postgres-conversation-repository";

let cached: ConversationLoggingService | undefined;

export function getLoggingService(): ConversationLoggingService {
  if (cached) return cached;

  if (!isDatabaseEnabled() || !env.DATABASE_ENABLED) {
    cached = createLoggingService(null);
    return cached;
  }

  cached = createLoggingService(new PostgresConversationRepository(getPool()));
  return cached;
}

export function resetLoggingServiceForTests(): void {
  cached = undefined;
}
