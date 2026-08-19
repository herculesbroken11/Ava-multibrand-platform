import {
  API_ERROR_CODES,
  MOCK_ERROR_TRIGGER,
  type ConversationResponse,
} from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { latestUserMessageContent } from "../../common/utils/ids";
import { buildMockReply, toSendMessageResult } from "./mock-responses";
import type { ConversationProvider, ConversationProviderInput } from "./provider";

const MOCK_DELAY_MS = 700;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const mockConversationProvider: ConversationProvider = {
  async complete(input: ConversationProviderInput): Promise<ConversationResponse> {
    await wait(MOCK_DELAY_MS);

    if (latestUserMessageContent(input.messages) === MOCK_ERROR_TRIGGER) {
      throw new AppError(
        500,
        API_ERROR_CODES.PROVIDER_ERROR,
        "Ava couldn’t reply just then. Please try again.",
      );
    }

    return toSendMessageResult(buildMockReply(input.messages));
  },
};

