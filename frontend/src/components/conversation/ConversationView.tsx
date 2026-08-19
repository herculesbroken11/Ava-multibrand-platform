"use client";

import { useEffect, useRef } from "react";
import type { BrandConfig } from "@/brands/types";
import { ConversationComposer } from "@/components/conversation/ConversationComposer";
import { ConversationError } from "@/components/conversation/ConversationError";
import { ConversationHeader } from "@/components/conversation/ConversationHeader";
import { ConversationShell } from "@/components/conversation/ConversationShell";
import { MessageList } from "@/components/conversation/MessageList";
import { SuggestedFollowUps } from "@/components/conversation/SuggestedFollowUps";
import { useConversationSession } from "@/conversation/use-conversation-session";

export function ConversationView({
  brand,
  initialQuestion,
}: {
  brand: BrandConfig;
  initialQuestion?: string;
}) {
  const {
    messages,
    isLoading,
    hasError,
    hydrated,
    sendUserMessage,
    retry,
    followUps,
  } = useConversationSession({ brand, initialQuestion });
  const endRef = useRef<HTMLDivElement>(null);
  const latestAva = [...messages].reverse().find((message) => message.role === "ava");

  useEffect(() => {
    endRef.current?.scrollIntoView({
      block: "end",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [messages, isLoading, hasError, followUps]);

  const statusText = isLoading
    ? brand.conversation.loadingLabel
    : hasError
      ? brand.conversation.errorMessage
      : latestAva?.content;

  return (
    <ConversationShell
      brand={brand}
      header={<ConversationHeader brand={brand} />}
      footer={
        <ConversationComposer
          brand={brand}
          disabled={!hydrated || isLoading}
          onSend={sendUserMessage}
        />
      }
    >
      <main
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
        aria-busy={isLoading}
      >
        <div className="site-shell py-4 md:py-6">
          {!hydrated ? (
            <p className="text-sm font-medium text-muted">
              {brand.conversation.loadingLabel}
            </p>
          ) : messages.length === 0 && !isLoading ? (
            <div className="mx-auto max-w-xl py-10 text-center">
              <h2 className="font-sans text-2xl font-extrabold tracking-[-0.03em] text-heading">
                {brand.conversation.emptyHeading}
              </h2>
              <p className="mt-3 text-base leading-7 text-muted">
                {brand.conversation.emptyBody}
              </p>
            </div>
          ) : (
            <MessageList
              brand={brand}
              messages={messages}
              isLoading={isLoading}
            />
          )}
          {hasError ? (
            <div className="mt-4 max-w-[min(42rem,100%)]">
              <ConversationError brand={brand} onRetry={retry} />
            </div>
          ) : null}
          {followUps.length > 0 ? (
            <div className="mt-4 max-w-[min(42rem,100%)]">
              <SuggestedFollowUps
                brand={brand}
                followUps={followUps}
                disabled={isLoading}
                onSelect={sendUserMessage}
              />
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {statusText}
        </p>
      </main>
    </ConversationShell>
  );
}
