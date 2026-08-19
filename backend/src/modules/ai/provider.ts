import type {
  ConversationMessage,
  ConversationResponse,
} from "@product-reviews/contracts";
import type { BackendBrand } from "../brands/registry";

export interface ConversationProviderInput {
  brand: BackendBrand;
  sessionId: string;
  messages: ConversationMessage[];
}

export interface ConversationProvider {
  complete(input: ConversationProviderInput): Promise<ConversationResponse>;
}
