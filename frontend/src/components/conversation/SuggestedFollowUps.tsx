import type { BrandConfig } from "@/brands/types";

export function SuggestedFollowUps({
  brand,
  followUps,
  disabled,
  onSelect,
}: {
  brand: BrandConfig;
  followUps: string[];
  disabled?: boolean;
  onSelect: (text: string) => void;
}) {
  if (followUps.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
        {brand.conversation.followUpsLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        {followUps.map((followUp) => (
          <button
            key={followUp}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(followUp)}
            className="inline-flex min-h-11 max-w-full items-center rounded-full border border-line bg-card px-4 py-2 text-left text-sm font-semibold break-words text-heading transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {followUp}
          </button>
        ))}
      </div>
    </div>
  );
}
