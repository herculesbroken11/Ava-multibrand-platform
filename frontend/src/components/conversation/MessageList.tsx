import type { BrandConfig } from "@/brands/types";
import type { ConversationMessage } from "@/conversation/types";
import { AvaMessage } from "@/components/conversation/AvaMessage";
import { TypingIndicator } from "@/components/conversation/TypingIndicator";
import { UserMessage } from "@/components/conversation/UserMessage";
import { cn } from "@/lib/cn";

export function MessageList({
  brand,
  messages,
  isLoading,
  className,
}: {
  brand: BrandConfig;
  messages: ConversationMessage[];
  isLoading: boolean;
  className?: string;
}) {
  const avaTurnById = new Map(
    messages
      .filter((message) => message.role === "ava")
      .map((message, index) => [message.id, index + 1] as const),
  );

  return (
    <div
      role="region"
      className={cn("min-w-0 space-y-4 md:space-y-5", className)}
      aria-label={`Conversation with ${brand.ava.name}`}
    >
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AvaMessage
            key={message.id}
            brand={brand}
            message={message}
            turnNumber={avaTurnById.get(message.id)}
          />
        ),
      )}
      {isLoading ? <TypingIndicator brand={brand} /> : null}
    </div>
  );
}
