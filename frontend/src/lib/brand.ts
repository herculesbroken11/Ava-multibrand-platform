import {
  resolveBrandByHost,
  selectRequestHost,
  type BrandId,
} from "@product-reviews/contracts";
import { brandRegistry } from "../brands/registry";
import type { BrandConfig } from "../brands/types";

export function getBrandById(id: string): BrandConfig | undefined {
  return brandRegistry[id];
}

export function nodeEnvFromProcess(
  value = process.env.NODE_ENV,
): "development" | "test" | "production" {
  if (value === "production" || value === "test") return value;
  return "development";
}

export function trustForwardedHostEnabled(
  value = process.env.TRUST_FORWARDED_HOST,
): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

export function resolveBrandFromHost(
  rawHost: string | undefined,
  options: {
    nodeEnv?: "development" | "test" | "production";
    defaultDevBrand?: string;
    allowTestBrands?: boolean;
  } = {},
): BrandConfig | undefined {
  const shared = resolveBrandByHost(rawHost, {
    nodeEnv: options.nodeEnv ?? nodeEnvFromProcess(),
    defaultDevBrand: options.defaultDevBrand ?? process.env.DEFAULT_DEV_BRAND ?? "productreviews",
    allowTestBrands: options.allowTestBrands,
  });
  if (!shared) return undefined;
  return brandRegistry[shared.id as BrandId];
}

export function resolveBrandFromRequestHeaders(input: {
  host?: string | null;
  forwardedHost?: string | null;
  trustForwardedHost?: boolean;
  nodeEnv?: "development" | "test" | "production";
  defaultDevBrand?: string;
}): BrandConfig | undefined {
  const host = selectRequestHost({
    host: input.host,
    forwardedHost: input.forwardedHost,
    trustForwardedHost: input.trustForwardedHost ?? trustForwardedHostEnabled(),
  });
  return resolveBrandFromHost(host, {
    nodeEnv: input.nodeEnv,
    defaultDevBrand: input.defaultDevBrand,
  });
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
