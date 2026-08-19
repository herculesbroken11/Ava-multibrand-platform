import Link from "next/link";
import type { BrandConfig } from "@/brands/types";
import { BrandLogo } from "@/components/BrandLogo";

export function Header({ brand }: { brand: BrandConfig }) {
  const hasNav = brand.header.nav.length > 0;

  return (
    <header className="relative z-30 bg-page">
      <div className="site-shell flex h-16 items-center justify-between gap-2 md:h-20 md:gap-4 xl:h-[92px]">
        <BrandLogo brand={brand} />
        <div className="flex min-w-0 items-center gap-3 md:gap-6">
          {hasNav ? (
            <nav
              className="hidden items-center gap-6 md:flex lg:gap-8"
              aria-label="Primary"
            >
              {brand.header.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[15px] font-bold text-heading transition-colors hover:text-brand lg:text-[17px]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <Link
            href={brand.header.ctaHref}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-brand px-3 text-[0.82rem] font-bold whitespace-nowrap text-on-primary transition-colors hover:bg-brand-hover md:px-5 md:text-[0.95rem]"
          >
            {brand.header.ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
