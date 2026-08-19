"use client";

import { sanitizeAnalyticsParams } from "@product-reviews/contracts";
import { sanitizedPageLocation } from "@/lib/analytics/config";

export const ANALYTICS_EVENTS = {
  askAvaStart: "ask_ava_start",
  avaTurn: "ava_turn",
  avaRetry: "ava_retry",
} as const;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function analyticsRuntimeEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function emit(eventName: string, params: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined" || !analyticsRuntimeEnabled()) return;

    const cleaned = sanitizeAnalyticsParams(params);
    const pageLocation = sanitizedPageLocation();
    const payload = pageLocation
      ? { ...cleaned, page_location: pageLocation }
      : cleaned;

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
      return;
    }

    if (!Array.isArray(window.dataLayer)) return;
    window.dataLayer.push({ event: eventName, ...payload });
  } catch {
    // Analytics must never break the product UI.
  }
}

export function trackAskAvaStart(input: {
  brandId: string;
  entry: "composer" | "suggested_question";
}): void {
  emit(ANALYTICS_EVENTS.askAvaStart, {
    brand_id: input.brandId,
    entry: input.entry,
  });
}

export function trackAvaTurn(input: {
  brandId: string;
  result: "success" | "error" | "rate_limited" | "capacity_limited";
  isFollowUp: boolean;
  hasSources: boolean;
}): void {
  emit(ANALYTICS_EVENTS.avaTurn, {
    brand_id: input.brandId,
    result: input.result,
    is_follow_up: input.isFollowUp,
    has_sources: input.hasSources,
  });
}

export function trackAvaRetry(input: { brandId: string }): void {
  emit(ANALYTICS_EVENTS.avaRetry, {
    brand_id: input.brandId,
  });
}
