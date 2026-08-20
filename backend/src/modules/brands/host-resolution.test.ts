import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findDuplicateHostnames,
  normalizeHostname,
  resolveBrandByHost,
  selectRequestHost,
  type SharedBrandRecord,
} from "@product-reviews/contracts";
import { getBackendBrand } from "./registry";
import { validateBackendBrand, validateBackendBrandRegistry } from "./schema";
import { productReviewsBrand } from "../../../../frontend/src/brands/productreviews";
import { testBrand } from "../../../../frontend/src/brands/testbrand";
import {
  validateFrontendBrand,
  validateFrontendBrandRegistry,
  resolveFrontendPublicDir,
} from "../../../../frontend/src/brands/schema";
import { registeredFrontendBrands } from "../../../../frontend/src/brands/registry";
import { resolveBrandFromHost, resolveBrandFromRequestHeaders } from "../../../../frontend/src/lib/brand";

const production = { nodeEnv: "production" as const };
const development = { nodeEnv: "development" as const, defaultDevBrand: "productreviews" };
const testEnv = { nodeEnv: "test" as const, defaultDevBrand: "productreviews" };

describe("hostname normalization and brand resolution", () => {
  it("A: productreviews.com.au resolves ProductReviews", () => {
    const brand = resolveBrandByHost("productreviews.com.au", production);
    assert.equal(brand?.id, "productreviews");
    assert.equal(resolveBrandFromHost("productreviews.com.au", production)?.id, "productreviews");
  });

  it("B: www.productreviews.com.au resolves ProductReviews", () => {
    assert.equal(resolveBrandByHost("www.productreviews.com.au", production)?.id, "productreviews");
  });

  it("C: mixed-case host normalizes safely", () => {
    assert.equal(normalizeHostname("ProductReviews.com.au"), "productreviews.com.au");
    assert.equal(
      resolveBrandByHost("ProductReviews.com.au", production)?.id,
      "productreviews",
    );
  });

  it("D: host with port normalizes", () => {
    assert.equal(normalizeHostname("productreviews.com.au:3000"), "productreviews.com.au");
    assert.equal(
      resolveBrandByHost("productreviews.com.au:3000", production)?.id,
      "productreviews",
    );
  });

  it("E: evilproductreviews.com.au does not match ProductReviews", () => {
    assert.equal(
      resolveBrandByHost("evilproductreviews.com.au", production),
      undefined,
    );
    assert.equal(
      resolveBrandFromHost("evilproductreviews.com.au", production),
      undefined,
    );
  });

  it("F: unknown production host does not default to ProductReviews", () => {
    assert.equal(resolveBrandByHost("unknown.example", production), undefined);
    assert.equal(resolveBrandByHost("localhost", production), undefined);
  });

  it("G: localhost resolves the configured development brand", () => {
    assert.equal(normalizeHostname("localhost:3000"), "localhost");
    assert.equal(resolveBrandByHost("localhost", development)?.id, "productreviews");
    assert.equal(resolveBrandByHost("127.0.0.1", development)?.id, "productreviews");
    assert.equal(
      resolveBrandFromHost("localhost:3000", development)?.id,
      "productreviews",
    );
  });

  it("H: test fixture host resolves the fixture brand only in development/test", () => {
    assert.equal(resolveBrandByHost("testbrand.local", testEnv)?.id, "testbrand");
    assert.equal(resolveBrandFromHost("testbrand.local", testEnv)?.id, "testbrand");
    assert.equal(resolveBrandByHost("testbrand.local", production), undefined);
    assert.equal(getBackendBrand("testbrand", "production"), undefined);
    assert.ok(getBackendBrand("testbrand", "test"));
  });

  it("K: arbitrary forwarded-host spoofing cannot switch brand when proxy trust is disabled", () => {
    const host = selectRequestHost({
      host: "productreviews.com.au",
      forwardedHost: "testbrand.local",
      trustForwardedHost: false,
    });
    assert.equal(normalizeHostname(host), "productreviews.com.au");
    assert.equal(
      resolveBrandFromRequestHeaders({
        host: "productreviews.com.au",
        forwardedHost: "testbrand.local",
        trustForwardedHost: false,
        nodeEnv: "production",
      })?.id,
      "productreviews",
    );
    assert.equal(
      resolveBrandFromRequestHeaders({
        host: "productreviews.com.au",
        forwardedHost: "testbrand.local",
        trustForwardedHost: true,
        nodeEnv: "test",
      })?.id,
      "testbrand",
    );
  });
});

describe("brand configuration validation", () => {
  it("L: duplicate registered domain alias fails validation", () => {
    const records: SharedBrandRecord[] = [
      {
        id: "productreviews",
        canonicalDomain: "productreviews.com.au",
        hostAliases: ["www.productreviews.com.au"],
        kind: "production",
      },
      {
        id: "testbrand",
        canonicalDomain: "testbrand.local",
        hostAliases: ["www.productreviews.com.au"],
        kind: "test",
      },
    ];
    const duplicates = findDuplicateHostnames(records);
    assert.ok(duplicates.some((item) => item.includes("www.productreviews.com.au")));
  });

  it("M: invalid brand config fails validation", () => {
    const invalid = {
      ...productReviewsBrand,
      hero: { ...productReviewsBrand.hero, heading: "" },
      colors: { ...productReviewsBrand.colors, primary: "green" },
      analytics: { gaMeasurementId: "not-a-ga-id" },
    };
    const issues = validateFrontendBrand(invalid, { checkAssets: false });
    assert.ok(issues.some((item) => item.includes("hero.heading")));
    assert.ok(issues.some((item) => item.includes("colors.primary")));
    assert.ok(issues.some((item) => item.includes("analytics.gaMeasurementId")));

    const backend = getBackendBrand("productreviews");
    assert.ok(backend);
    const backendIssues = validateBackendBrand({ ...backend, currency: "AU" });
    assert.ok(backendIssues.length > 0);
  });

  it("N: missing critical ProductReviews asset fails validation", () => {
    const missing = {
      ...productReviewsBrand,
      images: {
        ...productReviewsBrand.images,
        heroScene: {
          src: "/brands/productreviews/missing-hero.png",
          alt: "Missing",
        },
      },
    };
    const issues = validateFrontendBrand(missing, {
      checkAssets: true,
      publicDir: resolveFrontendPublicDir(),
    });
    assert.ok(issues.some((item) => item.includes("missing-hero.png")));
  });

  it("registered configs pass validation including ProductReviews hero", () => {
    const frontendIssues = validateFrontendBrandRegistry(registeredFrontendBrands, {
      publicDir: resolveFrontendPublicDir(),
    });
    assert.deepEqual(frontendIssues, []);
    assert.deepEqual(validateBackendBrandRegistry(), []);
    assert.equal(testBrand.kind, "test");
    assert.equal(productReviewsBrand.kind, "production");
  });
});
