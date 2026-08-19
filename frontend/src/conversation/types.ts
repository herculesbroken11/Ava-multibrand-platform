import type { ConversationMessage } from "@product-reviews/contracts";

export type {
  ApiErrorBody,
  ComparisonColumn,
  ComparisonTableData,
  ConversationMessage,
  ConversationRequest,
  ConversationResponse,
  ConversationRole,
  MessageRole,
  MessageStatus,
  SourceReference,
  StructuredBlock,
} from "@product-reviews/contracts";

export interface ConversationSession {
  id: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageInput {
  messages: ConversationMessage[];
  sessionId: string;
  brand: {
    id: string;
    name: string;
    ava: {
      name: string;
    };
  };
}

export interface SendMessageResult {
  message: ConversationMessage;
  followUps: string[];
}

export interface ConversationService {
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;
}

export class ConversationRequestError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(
    message = "The conversation service could not complete that request.",
    options: { status?: number; code?: string } = {},
  ) {
    super(message);
    this.name = "ConversationRequestError";
    this.status = options.status;
    this.code = options.code;
  }
}
