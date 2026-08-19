import { productReviewsBrand } from "@/brands/productreviews";
import { brandRegistry } from "@/brands/registry";
import type { BrandConfig } from "@/brands/types";

export function getBrandById(id: string): BrandConfig | undefined {
  return brandRegistry[id];
}

export function getBrandByDomain(domain: string): BrandConfig | undefined {
  const normalised = domain.replace(/^www\./, "").toLowerCase();
  return Object.values(brandRegistry).find(
    (brand) => brand.domain.toLowerCase() === normalised,
  );
}

/**
 * Phase 1 always falls back to ProductReviews.com.au.
 * Later phases can pass the request host to select another brand.
 */
export function getActiveBrand(host?: string): BrandConfig {
  if (host) {
    return getBrandByDomain(host) ?? productReviewsBrand;
  }

  return productReviewsBrand;
}

export function brandCssVars(
  brand: BrandConfig,
): Record<`--${string}`, string> {
  return {
    "--brand-primary": brand.colors.primary,
    "--brand-primary-hover": brand.colors.primaryHover,
    "--brand-primary-soft": brand.colors.primarySoft,
    "--brand-heading": brand.colors.heading,
    "--brand-body": brand.colors.body,
    "--brand-muted": brand.colors.muted,
    "--brand-background": brand.colors.background,
    "--brand-surface": brand.colors.surface,
    "--brand-card": brand.colors.card,
    "--brand-accent": brand.colors.accent,
    "--brand-footer": brand.colors.footer,
    "--brand-on-primary": brand.colors.onPrimary,
    "--brand-on-accent": brand.colors.onAccent,
    "--brand-border": brand.colors.border,
  };
}
