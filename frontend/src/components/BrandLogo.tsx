import Link from "next/link";
import type { BrandConfig, LogoColorToken } from "@/brands/types";
import { cn } from "@/lib/cn";

const colorClass: Record<LogoColorToken, string> = {
  heading: "text-heading",
  primary: "text-brand",
  muted: "text-muted",
  onPrimary: "text-on-primary",
};

export function BrandLogo({
  brand,
  href = "/",
  inverted = false,
  className,
}: {
  brand: BrandConfig;
  href?: string;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 min-w-0 items-start no-underline",
        className,
      )}
      aria-label={brand.logo.alt}
    >
      <span className="flex flex-col items-end">
        <span className="flex font-sans text-[1.2rem] font-extrabold leading-none tracking-[-0.04em] sm:text-[1.45rem] md:text-[1.75rem] xl:text-[2rem]">
          {brand.logo.parts.map((part) => (
            <span
              key={part.text}
              className={inverted ? "text-on-primary" : colorClass[part.color]}
            >
              {part.text}
            </span>
          ))}
        </span>
        {brand.logo.suffix ? (
          <span
            className={cn(
              "mt-0.5 text-[0.62rem] font-bold leading-none tracking-wide sm:text-[0.7rem] md:text-[0.8rem] xl:text-[0.85rem]",
              inverted ? "text-white/55" : "text-heading",
            )}
          >
            {brand.logo.suffix}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
