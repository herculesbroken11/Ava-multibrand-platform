import type {
  ConversationLoggingService,
  ConversationLogRepository,
  FailedTurnLog,
  PersistenceResult,
  SuccessfulTurnLog,
} from "./logging-types";

function logPersistenceFailure(): void {
  console.error(
    JSON.stringify({
      type: "conversation_persistence",
      status: "failed",
      code: "PERSISTENCE_FAILED",
    }),
  );
}

export function createLoggingService(
  repository: ConversationLogRepository | null,
): ConversationLoggingService {
  if (!repository) {
    return {
      async recordSuccessfulTurn(): Promise<PersistenceResult> {
        return { persisted: false };
      },
      async recordFailedTurn(): Promise<PersistenceResult> {
        return { persisted: false };
      },
    };
  }

  return {
    async recordSuccessfulTurn(input: SuccessfulTurnLog): Promise<PersistenceResult> {
      try {
        const turn = await repository.recordSuccessfulTurn(input);
        return { persisted: true, turn };
      } catch {
        logPersistenceFailure();
        return { persisted: false };
      }
    },
    async recordFailedTurn(input: FailedTurnLog): Promise<PersistenceResult> {
      try {
        const turn = await repository.recordFailedTurn(input);
        return { persisted: true, turn };
      } catch {
        logPersistenceFailure();
        return { persisted: false };
      }
    },
  };
}
