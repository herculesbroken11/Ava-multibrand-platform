import OpenAI from "openai";
import { API_ERROR_CODES } from "@product-reviews/contracts";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import type { LlmCompletionInput, LlmCompletionResult, LlmProvider } from "./llm-provider";
import { mapLlmProviderError } from "./map-provider-error";

export function createOpenAiProvider(options?: {
  apiKey?: string;
  model?: string;
}): LlmProvider {
  return {
    async complete(input: LlmCompletionInput): Promise<LlmCompletionResult> {
      const apiKey = options?.apiKey ?? env.AI_API_KEY;
      const model = options?.model ?? env.AI_MODEL;

      if (!apiKey) {
        throw new AppError(
          502,
          API_ERROR_CODES.PROVIDER_AUTH,
          "Ava couldn’t reply just then. Please try again.",
        );
      }

      const client = new OpenAI({
        apiKey,
        timeout: input.timeoutMs,
        maxRetries: 0,
      });

      try {
        const completion = await client.chat.completions.create({
          model,
          temperature: 0.4,
          max_tokens: input.maxOutputTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: input.system },
            ...input.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
        });

        const text = completion.choices[0]?.message?.content?.trim();
        if (!text) {
          throw new AppError(
            502,
            API_ERROR_CODES.PROVIDER_INVALID_RESPONSE,
            "Ava couldn’t reply just then. Please try again.",
          );
        }

        return { text };
      } catch (error) {
        throw mapLlmProviderError(error);
      }
    },
  };
}
