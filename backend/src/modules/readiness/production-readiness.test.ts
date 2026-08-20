import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productReviewsBrand } from "../../../../frontend/src/brands/productreviews";
import { PRODUCTREVIEWS_APPROVED_COPY as copy } from "../../../../frontend/src/brands/productreviews-approved-copy";
import { testBrand } from "../../../../frontend/src/brands/testbrand";
import { resolveFrontendPublicDir } from "../../../../frontend/src/brands/schema";
import type { BrandConfig, InformationPage } from "../../../../frontend/src/brands/types";
import {
  evaluateProductionReadiness,
  type ProductionReadinessInput,
} from "./production-readiness";

function finalPage(title: string): InformationPage {
  return {
    title,
    status: "final",
    intro: "Client-supplied text for tests only.",
    lastUpdated: "2026-08-19",
    blocks: [{ type: "paragraph", text: "Supplied legal paragraph for the synthetic production fixture." }],
  };
}

function launchBrand(overrides: Partial<BrandConfig> = {}): BrandConfig {
  return {
    ...productReviewsBrand,
    pages: {
      privacy: finalPage("Privacy Policy"),
      terms: finalPage("Terms & Conditions"),
      disclaimer: finalPage("Disclaimer"),
      contact: {
        title: "Contact",
        heading: "Contact",
        status: "final",
        email: "hello@productreviews.com.au",
        businessName: "ProductReviews.com.au",
        intro: "Email us with product-research questions.",
      },
      about: finalPage("About"),
    },
    learning: {
      ...productReviewsBrand.learning,
      ctaDestinationStatus: "final",
      ctaHref: "/contact",
    },
    ...overrides,
  };
}

function completeInput(
  overrides: Partial<ProductionReadinessInput> = {},
): ProductionReadinessInput {
  return {
    nodeEnv: "production",
    aiProvider: "openai",
    aiApiKey: "secret-test-key-do-not-print",
    aiModel: "gpt-4o-mini",
    searchProvider: "openai",
    databaseEnabled: true,
    databaseUrl: "postgresql://ava:supersecret@db.example/productreviews",
    databasePoolMax: 10,
    frontendOrigin: "https://productreviews.com.au",
    frontendOrigins:
      "https://productreviews.com.au,https://www.productreviews.com.au",
    apiBaseUrl: "https://api.productreviews.example",
    analyticsEnabled: false,
    analyticsRequired: false,
    requireFinalContent: true,
    rateLimitEnabled: true,
    rateLimitMax: 30,
    rateLimitWindowMs: 60_000,
    aiMaxConcurrent: 4,
    searchMaxConcurrent: 4,
    trustProxy: false,
    trustForwardedHost: false,
    defaultDevBrand: "productreviews",
    retentionDays: "",
    retentionApproved: false,
    brand: launchBrand(),
    publicDir: resolveFrontendPublicDir(),
    ...overrides,
  };
}

describe("production readiness", () => {
  it("A: valid production configuration passes technical readiness", () => {
    const report = evaluateProductionReadiness(completeInput());
    assert.equal(report.ready, true);
    assert.equal(report.blockers.length, 0);
    assert.ok(report.warnings.some((item) => item.code === "RETENTION"));
    assert.ok(report.warnings.some((item) => item.code === "ANALYTICS"));
  });

  it("B: AI_PROVIDER=mock is a blocker", () => {
    const report = evaluateProductionReadiness(completeInput({ aiProvider: "mock" }));
    assert.equal(report.ready, false);
    assert.ok(report.blockers.some((item) => item.code === "AI_PROVIDER"));
  });

  it("C: SEARCH_PROVIDER=mock is a blocker", () => {
    const report = evaluateProductionReadiness(completeInput({ searchProvider: "mock" }));
    assert.ok(report.blockers.some((item) => item.code === "SEARCH_PROVIDER"));
  });

  it("D: missing production AI key is a blocker", () => {
    const report = evaluateProductionReadiness(completeInput({ aiApiKey: "" }));
    assert.ok(report.blockers.some((item) => item.code === "AI_API_KEY"));
    assert.match(report.output, /Client-owned production AI credentials pending/);
  });

  it("E: DATABASE_ENABLED=false is a blocker", () => {
    const report = evaluateProductionReadiness(completeInput({ databaseEnabled: false }));
    assert.ok(report.blockers.some((item) => item.code === "DATABASE_ENABLED"));
  });

  it("F: localhost API URL is a blocker", () => {
    const report = evaluateProductionReadiness(
      completeInput({ apiBaseUrl: "http://localhost:4000" }),
    );
    assert.ok(report.blockers.some((item) => item.code === "API_BASE_URL"));
  });

  it("F2: template API hostname placeholder is a blocker", () => {
    const report = evaluateProductionReadiness(
      completeInput({ apiBaseUrl: "https://REPLACE_WITH_PRODUCTION_API_ORIGIN" }),
    );
    assert.ok(report.blockers.some((item) => item.code === "API_BASE_URL"));
  });

  it("G: unknown host configuration is a blocker", () => {
    const report = evaluateProductionReadiness(
      completeInput({
        frontendOrigin: "https://unknown.example",
        frontendOrigins: "https://unknown.example",
      }),
    );
    assert.ok(report.blockers.some((item) => item.code === "FRONTEND_ORIGINS"));
  });

  it("H: missing critical asset is a blocker", () => {
    const report = evaluateProductionReadiness(
      completeInput({
        brand: launchBrand({
          images: {
            ...productReviewsBrand.images,
            heroScene: {
              src: "/brands/productreviews/missing-hero.png",
              alt: "Missing",
            },
          },
        }),
      }),
    );
    assert.ok(report.blockers.some((item) => item.code === "REQUIRED_ASSET" || item.code === "BRAND_CONFIG"));
  });

  it("I: placeholder legal page is detected", () => {
    const report = evaluateProductionReadiness(
      completeInput({ brand: productReviewsBrand }),
    );
    assert.ok(report.findings.some((item) => item.code === "LEGAL_CONTENT"));
    assert.equal(
      report.findings.find((item) => item.code === "LEGAL_CONTENT")?.severity,
      "BLOCKER",
    );
  });

  it("J: retention pending is reported without inventing a duration", () => {
    const report = evaluateProductionReadiness(completeInput());
    const retention = report.warnings.find((item) => item.code === "RETENTION");
    assert.ok(retention);
    assert.match(retention.message, /unresolved/i);
    assert.doesNotMatch(retention.message, /\b30\b|\b90\b|\b365\b/);
  });

  it("K: analytics disabled follows explicit policy", () => {
    const report = evaluateProductionReadiness(completeInput({ analyticsEnabled: false }));
    assert.equal(report.findings.find((item) => item.code === "ANALYTICS")?.severity, "WARNING");
    const required = evaluateProductionReadiness(
      completeInput({ analyticsEnabled: false, analyticsRequired: true }),
    );
    assert.ok(required.blockers.some((item) => item.code === "ANALYTICS"));
  });

  it("L: invalid GA/GTM id does not become ready", () => {
    const report = evaluateProductionReadiness(
      completeInput({
        analyticsEnabled: true,
        gaMeasurementId: "not-a-ga-id",
        gtmId: "nope",
      }),
    );
    assert.ok(report.blockers.some((item) => item.code === "ANALYTICS_ID"));
  });

  it("M: no secret values appear in readiness output", () => {
    const report = evaluateProductionReadiness(completeInput());
    assert.equal(report.output.includes("secret-test-key-do-not-print"), false);
    assert.equal(report.output.includes("supersecret"), false);
    assert.equal(report.output.includes("postgresql://ava:supersecret"), false);
  });

  it("N: test fixture cannot become the production brand", () => {
    const report = evaluateProductionReadiness(completeInput({ brand: testBrand, defaultDevBrand: "testbrand" }));
    assert.ok(report.blockers.some((item) => item.code === "PRODUCTION_BRAND"));
    assert.ok(report.blockers.some((item) => item.code === "DEFAULT_DEV_BRAND"));
  });

  it("O: ProductReviews approved copy remains unchanged", () => {
    assert.equal(productReviewsBrand.hero.heading, copy.hero.heading);
    assert.equal(productReviewsBrand.hero.headingAccent, copy.hero.headingAccent);
    assert.deepEqual(productReviewsBrand.hero.trustItems, [...copy.hero.trustItems]);
    assert.equal(productReviewsBrand.hero.handwrittenNote, copy.hero.handwrittenNote);
    assert.equal(productReviewsBrand.askAva.headlinePrefix, copy.askAva.headlinePrefix);
    assert.equal(productReviewsBrand.askAva.headlineAccent, copy.askAva.headlineAccent);
    assert.equal(productReviewsBrand.askAva.placeholder, copy.askAva.placeholder);
    assert.equal(productReviewsBrand.askAva.cta, copy.askAva.cta);
    assert.equal(productReviewsBrand.suggestedQuestions.heading, copy.suggestedQuestions.heading);
    assert.equal(productReviewsBrand.suggestedQuestions.subheading, copy.suggestedQuestions.subheading);
    assert.deepEqual(
      productReviewsBrand.suggestedQuestions.questions.map((item) => item.text),
      [...copy.suggestedQuestions.questions],
    );
    assert.equal(productReviewsBrand.independence.headline, copy.independence.headline);
    assert.equal(productReviewsBrand.independence.subtitle, copy.independence.subtitle);
    assert.deepEqual(productReviewsBrand.independence.paragraphs, [...copy.independence.paragraphs]);
    assert.equal(productReviewsBrand.learning.heading, copy.learning.heading);
    assert.equal(productReviewsBrand.learning.body, copy.learning.body);
    assert.equal(productReviewsBrand.learning.cta, copy.learning.cta);
    assert.equal(productReviewsBrand.footer.tagline, copy.footer.tagline);
    assert.equal(productReviewsBrand.footer.copyright, copy.footer.copyright);
    assert.deepEqual(
      productReviewsBrand.legal.map((item) => item.label),
      [...copy.legalLabels],
    );
  });
});
