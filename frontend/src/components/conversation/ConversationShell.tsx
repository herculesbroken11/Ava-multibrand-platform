import type { ReactNode } from "react";
import type { BrandConfig } from "@/brands/types";
import { cn } from "@/lib/cn";

export function ConversationShell({
  brand,
  header,
  children,
  footer,
  className,
}: {
  brand: BrandConfig;
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-dvh max-h-dvh flex-col overflow-hidden bg-surface",
        className,
      )}
    >
      {header}
      {process.env.NODE_ENV !== "production" && brand.conversation.previewNotice ? (
        <p className="border-b border-line bg-brand-soft px-4 py-2 text-center text-xs font-medium leading-5 text-heading md:text-sm">
          {brand.conversation.previewNotice}
        </p>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      {footer}
    </div>
  );
}
