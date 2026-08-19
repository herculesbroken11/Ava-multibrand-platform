import type { FastifyInstance } from "fastify";
import { API_ERROR_CODES, CONVERSATION_MESSAGE_PATH } from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { conversationRequestSchema } from "./schemas";
import { sendConversationMessage } from "./service";

export async function registerConversationRoutes(app: FastifyInstance): Promise<void> {
  app.post(CONVERSATION_MESSAGE_PATH, async (request) => {
    const parsed = conversationRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(
        400,
        API_ERROR_CODES.VALIDATION_ERROR,
        "The conversation request was invalid.",
      );
    }

    return sendConversationMessage(parsed.data);
  });
}
