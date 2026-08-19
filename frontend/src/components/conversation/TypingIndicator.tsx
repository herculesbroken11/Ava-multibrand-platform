import type { BrandConfig } from "@/brands/types";

export function TypingIndicator({ brand }: { brand: BrandConfig }) {
  return (
    <div className="flex justify-start" aria-hidden="true">
      <div className="max-w-[min(42rem,100%)]">
        <p className="mb-1.5 text-sm font-extrabold tracking-[-0.02em] text-brand">
          {brand.ava.name}
        </p>
        <div className="inline-flex items-center gap-1.5 rounded-[22px] rounded-tl-md border border-line bg-card px-4 py-3">
          <span className="ava-typing-dot h-2 w-2 rounded-full bg-brand" />
          <span className="ava-typing-dot h-2 w-2 rounded-full bg-brand" />
          <span className="ava-typing-dot h-2 w-2 rounded-full bg-brand" />
        </div>
      </div>
    </div>
  );
}
