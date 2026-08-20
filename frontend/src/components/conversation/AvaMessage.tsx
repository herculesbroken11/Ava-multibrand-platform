import type { BrandConfig } from "@/brands/types";
import type { ConversationMessage } from "@/conversation/types";
import { EmphasizedText } from "@/components/conversation/EmphasizedText";
import { SourceReferences } from "@/components/conversation/SourceReferences";
import { StructuredResponse } from "@/components/conversation/StructuredResponse";

function hasSourcesBlock(message: ConversationMessage): boolean {
  return (
    message.structuredContent?.some((block) => block.type === "sources") ?? false
  );
}

export function AvaMessage({
  brand,
  message,
  turnNumber,
}: {
  brand: BrandConfig;
  message: ConversationMessage;
  turnNumber?: number;
}) {
  const paragraphs = message.content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <article className="flex justify-start">
      <div className="max-w-[min(42rem,100%)] min-w-0">
        <p className="mb-1.5 text-sm font-extrabold tracking-[-0.02em] text-brand">
          {brand.ava.name}
        </p>
        <div className="rounded-[22px] rounded-tl-md border border-line bg-card px-4 py-3.5 text-[0.98rem] leading-6 text-body shadow-[0_8px_24px_rgba(40,32,20,0.05)] md:px-5 md:py-4 md:text-base md:leading-7">
          <div className="space-y-3">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap break-words">
                <EmphasizedText text={paragraph} />
              </p>
            ))}
          </div>
          {message.structuredContent?.length ? (
            <StructuredResponse
              blocks={message.structuredContent}
              brandId={brand.id}
              turnNumber={turnNumber}
              responseKey={message.id}
            />
          ) : null}
          {message.sources?.length && !hasSourcesBlock(message) ? (
            <SourceReferences
              sources={message.sources}
              brandId={brand.id}
              turnNumber={turnNumber}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
