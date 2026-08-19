import {
  isGa4MeasurementId,
  isGtmContainerId,
} from "@product-reviews/contracts";
import type { BrandConfig } from "@/brands/types";

export type AnalyticsMode = "off" | "gtm" | "gtag";

export interface ResolvedAnalyticsConfig {
  enabled: boolean;
  mode: AnalyticsMode;
  gtmId?: string;
  gaMeasurementId?: string;
}

function envFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

function envValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveAnalyticsConfig(
  brand: Pick<BrandConfig, "analytics">,
): ResolvedAnalyticsConfig {
  if (!envFlag(process.env.NEXT_PUBLIC_ANALYTICS_ENABLED)) {
    return { enabled: false, mode: "off" };
  }

  const gtmId = [envValue(process.env.NEXT_PUBLIC_GTM_ID), brand.analytics.gtmId].find(
    isGtmContainerId,
  );
  const gaMeasurementId = [
    envValue(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    brand.analytics.gaMeasurementId,
  ].find(isGa4MeasurementId);

  if (gtmId) {
    return { enabled: true, mode: "gtm", gtmId };
  }

  if (gaMeasurementId) {
    return { enabled: true, mode: "gtag", gaMeasurementId };
  }

  return { enabled: false, mode: "off" };
}

export function sanitizedPageLocation(href = typeof window === "undefined" ? "" : window.location.href): string {
  try {
    const url = new URL(href);
    return `${url.origin}${url.pathname}${url.hash}`;
  } catch {
    return "";
  }
}
