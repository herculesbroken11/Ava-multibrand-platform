import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeAnalyticsParams } from "@product-reviews/contracts";
import { ANALYTICS_EVENTS, createAnalyticsTracker } from "../../../frontend/src/lib/analytics/runtime";

function recordingTracker(enabled = true) {
  const sent: Array<{ event: string; params: Record<string, unknown> }> = [];
  const tracker = createAnalyticsTracker({
    isEnabled: () => enabled,
    send(eventName, params) {
      sent.push({ event: eventName, params });
    },
  });
  return { tracker, sent };
}

describe("step 8 analytics completion events", () => {
  it("fires source_open with brand_id and turn_number only", () => {
    const { tracker, sent } = recordingTracker();
    tracker.trackSourceOpen({ brandId: "productreviews", turnNumber: 2 });

    assert.deepEqual(sent, [
      {
        event: ANALYTICS_EVENTS.sourceOpen,
        params: { brand_id: "productreviews", turn_number: 2 },
      },
    ]);
    const serialized = JSON.stringify(sent);
    assert.equal(serialized.includes("http"), false);
    assert.equal(serialized.includes("href"), false);
    assert.equal(serialized.includes("dyson.com"), false);
  });

  it("never sends a source URL, title, question, answer, or session id", () => {
    const { tracker, sent } = recordingTracker();
    tracker.trackSourceOpen({ brandId: "productreviews", turnNumber: 1 });
    assert.deepEqual(sent[0]?.params, {
      brand_id: "productreviews",
      turn_number: 1,
    });
    const leaked = sanitizeAnalyticsParams({
      brand_id: "productreviews",
      turn_number: 1,
      url: "https://www.harveynorman.com.au/secret-listing",
      href: "https://www.harveynorman.com.au/secret-listing",
      title: "Harvey Norman Dyson listing",
      question: "What's the best robot vacuum?",
      answer: "A sealed-path robot.",
      session_id: "convo_secret",
    });
    assert.deepEqual(leaked, {
      brand_id: "productreviews",
      turn_number: 1,
    });
    const serialized = JSON.stringify(leaked);
    assert.equal(serialized.includes("harveynorman"), false);
    assert.equal(serialized.includes("robot vacuum"), false);
    assert.equal(serialized.includes("sealed-path"), false);
    assert.equal(serialized.includes("convo_secret"), false);
    assert.equal(serialized.includes("Harvey Norman"), false);
  });

  it("fires comparison_view once per logical response, not on rerender", () => {
    const { tracker, sent } = recordingTracker();
    const input = {
      brandId: "productreviews",
      turnNumber: 3,
      responseKey: "msg_ava_compare_1",
    };

    tracker.trackComparisonView(input);
    tracker.trackComparisonView(input);
    tracker.trackComparisonView({ ...input });

    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0], {
      event: ANALYTICS_EVENTS.comparisonView,
      params: { brand_id: "productreviews", turn_number: 3 },
    });
    assert.equal(JSON.stringify(sent).includes("msg_ava_compare_1"), false);
  });

  it("fires a second comparison_view for a different response", () => {
    const { tracker, sent } = recordingTracker();
    tracker.trackComparisonView({
      brandId: "productreviews",
      responseKey: "msg_one",
    });
    tracker.trackComparisonView({
      brandId: "productreviews",
      responseKey: "msg_two",
    });
    assert.deepEqual(
      sent.map((item) => item.event),
      [ANALYTICS_EVENTS.comparisonView, ANALYTICS_EVENTS.comparisonView],
    );
  });

  it("fires help_ava_smarter_click with brand_id only", () => {
    const { tracker, sent } = recordingTracker();
    tracker.trackHelpAvaSmarterClick({ brandId: "productreviews" });
    assert.deepEqual(sent, [
      {
        event: ANALYTICS_EVENTS.helpAvaSmarterClick,
        params: { brand_id: "productreviews" },
      },
    ]);
  });

  it("does not emit when analytics is disabled", () => {
    const { tracker, sent } = recordingTracker(false);
    tracker.trackSourceOpen({ brandId: "productreviews", turnNumber: 1 });
    tracker.trackComparisonView({
      brandId: "productreviews",
      responseKey: "msg_disabled",
    });
    tracker.trackHelpAvaSmarterClick({ brandId: "productreviews" });
    tracker.trackAskAvaStart({ brandId: "productreviews", entry: "composer" });
    assert.deepEqual(sent, []);
  });

  it("swallows tracker failures so the UI is not blocked", () => {
    const tracker = createAnalyticsTracker({
      isEnabled: () => true,
      send() {
        throw new Error("gtag blocked");
      },
    });
    assert.doesNotThrow(() => {
      tracker.trackSourceOpen({ brandId: "productreviews" });
      tracker.trackComparisonView({
        brandId: "productreviews",
        responseKey: "msg_fail",
      });
      tracker.trackHelpAvaSmarterClick({ brandId: "productreviews" });
    });
  });
});
