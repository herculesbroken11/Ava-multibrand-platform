"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { API_ERROR_CODES } from "@product-reviews/contracts";
import type { BrandConfig } from "@/brands/types";
import { createId, nowIso } from "@/conversation/ids";
import { getConversationService } from "@/conversation/service";
import {
  consumePendingQuestion,
  getConversationSnapshot,
  parseConversationSession,
  persistConversationSession,
  subscribeConversationStore,
} from "@/conversation/session-storage";
import {
  ConversationRequestError,
  type ConversationMessage,
  type ConversationSession,
} from "@/conversation/types";
import {
  trackAvaRetry,
  trackAvaTurn,
} from "@/lib/analytics/events";
import {
  MAX_QUESTION_LENGTH,
  clampQuestion,
  stripAskAvaQuestionParam,
} from "@/lib/ask-ava";

const service = getConversationService();
const inFlight = new Map<string, Promise<void>>();
const emptySubscribe = () => () => {};

function readSession(brandId: string): ConversationSession | null {
  return parseConversationSession(getConversationSnapshot(brandId));
}

function firstUserText(session: ConversationSession | null): string | undefined {
  return session?.messages.find((message) => message.role === "user")?.content;
}

function lastMessage(session: ConversationSession | null): ConversationMessage | undefined {
  return session?.messages[session.messages.length - 1];
}

function needsAvaReply(session: ConversationSession | null): boolean {
  return lastMessage(session)?.role === "user";
}

function createSession(question?: string): ConversationSession {
  const createdAt = nowIso();
  const messages: ConversationMessage[] = question
    ? [
        {
          id: createId("msg"),
          role: "user",
          content: question,
          createdAt,
          status: "complete",
        },
      ]
    : [];

  return {
    id: createId("convo"),
    messages,
    createdAt,
    updatedAt: createdAt,
  };
}

export function useConversationSession({
  brand,
  initialQuestion,
}: {
  brand: BrandConfig;
  initialQuestion?: string;
}) {
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const snapshot = useSyncExternalStore(
    subscribeConversationStore,
    () => getConversationSnapshot(brand.id),
    () => null,
  );
  const session = parseConversationSession(snapshot);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const bootstrapped = useRef(false);

  const persist = useCallback(
    (next: ConversationSession) => {
      persistConversationSession(brand.id, next);
    },
    [brand.id],
  );

  const requestAva = useCallback(
    async (next: ConversationSession) => {
      const lastUser = [...next.messages]
        .reverse()
        .find((message) => message.role === "user");
      if (!lastUser) return;

      const key = `${next.id}:${lastUser.id}`;
      const existing = inFlight.get(key);
      if (existing) {
        await existing;
        return;
      }

      const run = (async () => {
        setIsLoading(true);
        setHasError(false);
        setErrorCode(null);
        persist(next);

        const isFollowUp =
          next.messages.filter((message) => message.role === "user").length > 1;

        try {
          const result = await service.sendMessage({
            messages: next.messages,
            sessionId: next.id,
            brand,
          });
          if (readSession(brand.id)?.id !== next.id) return;

          persist({
            ...next,
            messages: [
              ...next.messages,
              {
                ...result.message,
                followUps: result.followUps,
              },
            ],
            updatedAt: nowIso(),
          });
          trackAvaTurn({
            brandId: brand.id,
            result: "success",
            isFollowUp,
            hasSources: Boolean(result.message.sources?.length),
          });
        } catch (error) {
          if (readSession(brand.id)?.id === next.id) {
            const code =
              error instanceof ConversationRequestError ? error.code : undefined;
            setHasError(true);
            setErrorCode(code ?? null);
            trackAvaTurn({
              brandId: brand.id,
              result:
                code === API_ERROR_CODES.RATE_LIMITED
                  ? "rate_limited"
                  : code === API_ERROR_CODES.CAPACITY_LIMITED
                    ? "capacity_limited"
                    : "error",
              isFollowUp,
              hasSources: false,
            });
          }
        } finally {
          if (readSession(brand.id)?.id === next.id) {
            setIsLoading(false);
          }
        }
      })();

      inFlight.set(key, run);
      try {
        await run;
      } finally {
        inFlight.delete(key);
      }
    },
    [brand, persist],
  );

  useEffect(() => {
    if (!hydrated || bootstrapped.current) return;
    bootstrapped.current = true;

    const pending = consumePendingQuestion(brand.id);
    const incoming = clampQuestion(initialQuestion || pending || "");
    const stored = readSession(brand.id);
    let next = stored;

    if (incoming) {
      next = firstUserText(stored) === incoming ? stored : createSession(incoming);
    }

    stripAskAvaQuestionParam();

    if (next && next !== stored) {
      persist(next);
    }

    if (next && needsAvaReply(next)) {
      void requestAva(next);
    }
  }, [brand.id, hydrated, initialQuestion, persist, requestAva]);

  const sendUserMessage = useCallback(
    (text: string) => {
      const content = clampQuestion(text);
      if (!content || isLoading) return false;

      const current = readSession(brand.id) ?? createSession();
      const updated: ConversationSession = {
        ...current,
        messages: [
          ...current.messages,
          {
            id: createId("msg"),
            role: "user",
            content,
            createdAt: nowIso(),
            status: "complete",
          },
        ],
        updatedAt: nowIso(),
      };

      void requestAva(updated);
      return true;
    },
    [brand.id, isLoading, requestAva],
  );

  const retry = useCallback(() => {
    const current = readSession(brand.id);
    if (!current || isLoading || !needsAvaReply(current)) return;
    trackAvaRetry({ brandId: brand.id });
    void requestAva(current);
  }, [brand.id, isLoading, requestAva]);

  const lastAva = [...(session?.messages ?? [])]
    .reverse()
    .find((message) => message.role === "ava");

  return {
    session,
    messages: session?.messages ?? [],
    isLoading,
    hasError,
    errorCode,
    hydrated,
    sendUserMessage,
    retry,
    followUps: !isLoading && !hasError ? lastAva?.followUps ?? [] : [],
    maxLength: MAX_QUESTION_LENGTH,
  };
}
