import Link from "next/link";
import type { BrandConfig } from "@/brands/types";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeftIcon } from "@/components/ui/icons";

export function ConversationHeader({ brand }: { brand: BrandConfig }) {
  return (
    <header className="border-b border-line bg-page">
      <div className="site-shell flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:py-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <BrandLogo brand={brand} />
          <Link
            href="/"
            aria-label={brand.conversation.backLabel}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-bold text-heading transition-colors hover:text-brand sm:px-3 md:hidden"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span aria-hidden="true" className="max-[360px]:hidden">
              {brand.conversation.backShortLabel}
            </span>
          </Link>
        </div>

        <div className="min-w-0 md:flex-1">
          <p className="truncate text-xs font-bold tracking-wide text-muted uppercase">
            {brand.name}
          </p>
          <h1 className="font-sans text-lg font-extrabold tracking-[-0.03em] text-heading md:text-xl">
            Ask {brand.ava.name}
          </h1>
          <p className="text-sm font-medium text-muted">{brand.ava.role}</p>
        </div>

        <Link
          href="/"
          className="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-bold text-heading transition-colors hover:border-brand hover:text-brand md:inline-flex"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {brand.conversation.backLabel}
        </Link>
      </div>
    </header>
  );
}
