import {
  sanitizeAnalyticsParams,
  type AnalyticsPrimitive,
} from "@product-reviews/contracts";

export const ANALYTICS_EVENTS = {
  askAvaStart: "ask_ava_start",
  avaTurn: "ava_turn",
  avaRetry: "ava_retry",
  sourceOpen: "source_open",
  comparisonView: "comparison_view",
  helpAvaSmarterClick: "help_ava_smarter_click",
} as const;

export interface AnalyticsAdapter {
  isEnabled: () => boolean;
  send: (eventName: string, params: Record<string, AnalyticsPrimitive>) => void;
}

function optionalTurnNumber(turnNumber: number | undefined): { turn_number?: number } {
  return typeof turnNumber === "number" && Number.isFinite(turnNumber)
    ? { turn_number: turnNumber }
    : {};
}

export function createComparisonViewOnce(seen = new Set<string>()) {
  return (responseKey: string): boolean => {
    if (!responseKey || seen.has(responseKey)) return false;
    seen.add(responseKey);
    return true;
  };
}

export function createAnalyticsTracker(adapter: AnalyticsAdapter) {
  const shouldEmitComparisonView = createComparisonViewOnce();

  function emit(eventName: string, params: Record<string, unknown>): void {
    try {
      if (!adapter.isEnabled()) return;
      adapter.send(eventName, sanitizeAnalyticsParams(params));
    } catch {
      // Analytics must never break the product UI.
    }
  }

  return {
    trackAskAvaStart(input: {
      brandId: string;
      entry: "composer" | "suggested_question";
    }): void {
      emit(ANALYTICS_EVENTS.askAvaStart, {
        brand_id: input.brandId,
        entry: input.entry,
      });
    },

    trackAvaTurn(input: {
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
    },

    trackAvaRetry(input: { brandId: string }): void {
      emit(ANALYTICS_EVENTS.avaRetry, {
        brand_id: input.brandId,
      });
    },

    trackSourceOpen(input: { brandId: string; turnNumber?: number }): void {
      emit(ANALYTICS_EVENTS.sourceOpen, {
        brand_id: input.brandId,
        ...optionalTurnNumber(input.turnNumber),
      });
    },

    trackComparisonView(input: {
      brandId: string;
      turnNumber?: number;
      responseKey: string;
    }): void {
      if (!shouldEmitComparisonView(input.responseKey)) return;
      emit(ANALYTICS_EVENTS.comparisonView, {
        brand_id: input.brandId,
        ...optionalTurnNumber(input.turnNumber),
      });
    },

    trackHelpAvaSmarterClick(input: { brandId: string }): void {
      emit(ANALYTICS_EVENTS.helpAvaSmarterClick, {
        brand_id: input.brandId,
      });
    },
  };
}

export type AnalyticsTracker = ReturnType<typeof createAnalyticsTracker>;
