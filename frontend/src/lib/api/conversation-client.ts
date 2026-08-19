import {
  API_ERROR_CODES,
  CONVERSATION_MESSAGE_PATH,
  type ApiErrorBody,
  type ConversationResponse,
} from "@product-reviews/contracts";
import {
  ConversationRequestError,
  type ConversationService,
  type SendMessageInput,
  type SendMessageResult,
} from "@/conversation/types";
import {
  CONVERSATION_REQUEST_TIMEOUT_MS,
  getApiBaseUrl,
} from "@/lib/api/config";

function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function isConversationResponse(value: unknown): value is ConversationResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as ConversationResponse;
  return (
    typeof record.message?.id === "string" &&
    record.message.role === "ava" &&
    typeof record.message.content === "string" &&
    Array.isArray(record.followUps)
  );
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ConversationRequestError(undefined, { status: response.status });
  }
}

function errorFromResponse(status: number, payload: unknown): ConversationRequestError {
  if (payload && typeof payload === "object" && "error" in payload) {
    const body = payload as ApiErrorBody;
    if (typeof body.error?.code === "string") {
      return new ConversationRequestError(body.error.message, {
        status,
        code: body.error.code,
      });
    }
  }

  if (status === 429) {
    return new ConversationRequestError(undefined, {
      status,
      code: API_ERROR_CODES.RATE_LIMITED,
    });
  }

  return new ConversationRequestError(undefined, { status });
}

export const httpConversationService: ConversationService = {
  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      throw new ConversationRequestError();
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${CONVERSATION_MESSAGE_PATH}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId: input.brand.id,
          sessionId: input.sessionId,
          messages: input.messages,
        }),
        signal: timeoutSignal(CONVERSATION_REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new ConversationRequestError();
    }

    const payload = await parseJson(response);

    if (!response.ok || !isConversationResponse(payload)) {
      throw errorFromResponse(response.status, payload);
    }

    return {
      message: payload.message,
      followUps: payload.followUps,
    };
  },
};
