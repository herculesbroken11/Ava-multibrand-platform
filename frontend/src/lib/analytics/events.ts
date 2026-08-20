"use client";

import { sanitizedPageLocation } from "@/lib/analytics/config";
import {
  ANALYTICS_EVENTS,
  createAnalyticsTracker,
  type AnalyticsTracker,
} from "@/lib/analytics/runtime";

export { ANALYTICS_EVENTS };

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

const browserTracker: AnalyticsTracker = createAnalyticsTracker({
  isEnabled: analyticsRuntimeEnabled,
  send(eventName, params) {
    if (typeof window === "undefined") return;

    const pageLocation = sanitizedPageLocation();
    const payload = pageLocation
      ? { ...params, page_location: pageLocation }
      : params;

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
      return;
    }

    if (!Array.isArray(window.dataLayer)) return;
    window.dataLayer.push({ event: eventName, ...payload });
  },
});

export const trackAskAvaStart = browserTracker.trackAskAvaStart.bind(browserTracker);
export const trackAvaTurn = browserTracker.trackAvaTurn.bind(browserTracker);
export const trackAvaRetry = browserTracker.trackAvaRetry.bind(browserTracker);
export const trackSourceOpen = browserTracker.trackSourceOpen.bind(browserTracker);
export const trackComparisonView = browserTracker.trackComparisonView.bind(browserTracker);
export const trackHelpAvaSmarterClick =
  browserTracker.trackHelpAvaSmarterClick.bind(browserTracker);
