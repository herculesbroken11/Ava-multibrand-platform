import type { BrandConfig } from "@/brands/types";

export function ConversationError({
  brand,
  onRetry,
  message,
}: {
  brand: BrandConfig;
  onRetry: () => void;
  message?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-line bg-card px-4 py-4"
      role="alert"
    >
      <p className="text-sm font-medium leading-6 text-body md:text-[0.95rem]">
        {message ?? brand.conversation.errorMessage}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand px-4 text-sm font-bold text-on-primary transition-colors hover:bg-brand-hover"
      >
        {brand.conversation.retryLabel}
      </button>
    </div>
  );
}
