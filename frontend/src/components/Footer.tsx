import Link from "next/link";
import type { BrandConfig } from "@/brands/types";
import { BrandLogo } from "@/components/BrandLogo";

export function Footer({ brand }: { brand: BrandConfig }) {
  return (
    <footer className="bg-footer text-on-primary">
      <div className="site-shell border-t border-white/10 py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
          <div className="max-w-sm">
            <BrandLogo brand={brand} inverted className="origin-left scale-90" />
            <p className="mt-3 text-sm leading-6 text-white/70">
              {brand.footer.tagline}
            </p>
          </div>
          <p className="text-xs font-semibold tracking-wide text-white/50 xl:text-center">
            {brand.footer.copyright}
          </p>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            aria-label="Legal"
          >
            {brand.legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
