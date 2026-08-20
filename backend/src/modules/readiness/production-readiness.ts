import {
  isGa4MeasurementId,
  isGtmContainerId,
  productionHttpsOrigins,
} from "@product-reviews/contracts";
import type { BrandConfig } from "../../../../frontend/src/brands/types";
import {
  classifyBrandAssets,
  resolveFrontendPublicDir,
  validateFrontendBrand,
} from "../../../../frontend/src/brands/schema";

export type ReadinessSeverity = "PASS" | "WARNING" | "BLOCKER";

export interface ReadinessFinding {
  severity: ReadinessSeverity;
  code: string;
  message: string;
}

export interface ProductionReadinessInput {
  nodeEnv: string;
  aiProvider: string;
  aiApiKey?: string;
  aiModel?: string;
  searchProvider: string;
  databaseEnabled: boolean;
  databaseUrl?: string;
  databasePoolMax?: number;
  frontendOrigin: string;
  frontendOrigins: string;
  apiBaseUrl: string;
  analyticsEnabled: boolean;
  gaMeasurementId?: string;
  gtmId?: string;
  analyticsRequired?: boolean;
  requireFinalContent?: boolean;
  rateLimitEnabled: boolean;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  aiMaxConcurrent: number;
  searchMaxConcurrent: number;
  trustProxy: boolean;
  trustForwardedHost: boolean;
  defaultDevBrand: string;
  retentionDays?: string;
  retentionApproved?: boolean;
  brand: BrandConfig;
  publicDir?: string;
}

export interface ProductionReadinessReport {
  findings: ReadinessFinding[];
  blockers: ReadinessFinding[];
  warnings: ReadinessFinding[];
  passes: ReadinessFinding[];
  ready: boolean;
  output: string;
}

function finding(
  severity: ReadinessSeverity,
  code: string,
  message: string,
): ReadinessFinding {
  return { severity, code, message };
}

function isLocalhostUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    );
  } catch {
    return /localhost|127\.0\.0\.1/i.test(value);
  }
}

export function redactReadinessText(text: string, secrets: string[] = []): string {
  let redacted = text;
  for (const secret of secrets.filter(Boolean)) {
    redacted = redacted.split(secret).join("[redacted]");
  }
  return redacted;
}

export function evaluateProductionReadiness(
  input: ProductionReadinessInput,
): ProductionReadinessReport {
  const findings: ReadinessFinding[] = [];
  const requireFinalContent = input.requireFinalContent !== false;
  const publicDir = input.publicDir ?? resolveFrontendPublicDir();
  const secrets = [input.aiApiKey ?? "", input.databaseUrl ?? ""];

  if (input.brand.kind !== "production" || input.brand.id !== "productreviews") {
    findings.push(
      finding(
        "BLOCKER",
        "PRODUCTION_BRAND",
        "The test fixture cannot be the production ProductReviews brand.",
      ),
    );
  } else {
    findings.push(finding("PASS", "PRODUCTION_BRAND", "Launch brand is ProductReviews."));
  }

  const brandIssues = validateFrontendBrand(input.brand, {
    publicDir,
    checkAssets: input.brand.kind === "production",
  });
  if (brandIssues.length) {
    findings.push(
      finding("BLOCKER", "BRAND_CONFIG", "ProductReviews brand configuration is invalid."),
    );
  } else {
    findings.push(finding("PASS", "BRAND_CONFIG", "ProductReviews brand configuration is valid."));
  }

  if (input.aiProvider === "mock") {
    findings.push(
      finding("BLOCKER", "AI_PROVIDER", "AI_PROVIDER=mock is not production-ready for ProductReviews."),
    );
  } else if (input.aiProvider !== "openai") {
    findings.push(finding("BLOCKER", "AI_PROVIDER", "Production AI must use the client's OpenAI account."));
  } else {
    findings.push(finding("PASS", "AI_PROVIDER", "AI_PROVIDER is openai."));
  }

  if (!input.aiApiKey?.trim()) {
    findings.push(
      finding("BLOCKER", "AI_API_KEY", "Client-owned production AI credentials pending."),
    );
  } else {
    findings.push(finding("PASS", "AI_API_KEY", "AI_API_KEY is present."));
  }

  if (!input.aiModel?.trim()) {
    findings.push(finding("BLOCKER", "AI_MODEL", "AI_MODEL must be set for production."));
  } else {
    findings.push(finding("PASS", "AI_MODEL", "AI_MODEL is present."));
  }

  if (input.searchProvider === "mock") {
    findings.push(
      finding("BLOCKER", "SEARCH_PROVIDER", "SEARCH_PROVIDER=mock is not production-ready."),
    );
  } else if (input.searchProvider !== "openai") {
    findings.push(
      finding("BLOCKER", "SEARCH_PROVIDER", "Production search must use an approved provider."),
    );
  } else {
    findings.push(finding("PASS", "SEARCH_PROVIDER", "SEARCH_PROVIDER is openai."));
  }

  if (!input.databaseEnabled) {
    findings.push(
      finding("BLOCKER", "DATABASE_ENABLED", "DATABASE_ENABLED=false is not production-ready."),
    );
  } else if (!input.databaseUrl?.trim()) {
    findings.push(finding("BLOCKER", "DATABASE_URL", "DATABASE_URL is required when logging is enabled."));
  } else {
    findings.push(finding("PASS", "DATABASE", "Database logging configuration is present."));
  }

  if (
    input.databasePoolMax !== undefined &&
    (input.databasePoolMax < 1 || input.databasePoolMax > 50)
  ) {
    findings.push(finding("BLOCKER", "DATABASE_POOL_MAX", "DATABASE_POOL_MAX is out of range."));
  }

  if (!input.apiBaseUrl?.trim() || isLocalhostUrl(input.apiBaseUrl)) {
    findings.push(
      finding(
        "BLOCKER",
        "API_BASE_URL",
        "NEXT_PUBLIC_API_BASE_URL must be a real HTTPS API URL, not localhost. Final hostname is pending hosting architecture.",
      ),
    );
  } else if (/replace_with_production_api_origin/i.test(input.apiBaseUrl)) {
    findings.push(
      finding(
        "BLOCKER",
        "API_BASE_URL",
        "NEXT_PUBLIC_API_BASE_URL is still the production template placeholder. Final API hostname is pending hosting architecture.",
      ),
    );
  } else if (!input.apiBaseUrl.startsWith("https://")) {
    findings.push(finding("BLOCKER", "API_BASE_URL", "Production API URL must be HTTPS."));
  } else {
    findings.push(finding("PASS", "API_BASE_URL", "API base URL is HTTPS and not localhost."));
  }

  const originList = [input.frontendOrigin, ...input.frontendOrigins.split(",")]
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const expected = productionHttpsOrigins();
  const missingOrigin = expected.some((origin) => !originList.includes(origin));
  if (originList.some(isLocalhostUrl) && input.nodeEnv === "production") {
    findings.push(
      finding("BLOCKER", "FRONTEND_ORIGIN", "Production CORS origins must not be localhost."),
    );
  } else if (missingOrigin) {
    findings.push(
      finding(
        "BLOCKER",
        "FRONTEND_ORIGINS",
        "Production CORS must include https://productreviews.com.au and https://www.productreviews.com.au.",
      ),
    );
  } else {
    findings.push(finding("PASS", "FRONTEND_ORIGINS", "ProductReviews production origins are listed."));
  }

  if (input.nodeEnv !== "production") {
    findings.push(
      finding("BLOCKER", "NODE_ENV", "NODE_ENV must be production for a production readiness check."),
    );
  } else {
    findings.push(finding("PASS", "NODE_ENV", "NODE_ENV is production."));
  }

  if (input.defaultDevBrand === "testbrand") {
    findings.push(
      finding("BLOCKER", "DEFAULT_DEV_BRAND", "The test fixture cannot become the production brand."),
    );
  } else {
    findings.push(
      finding(
        "PASS",
        "DEFAULT_DEV_BRAND",
        "DEFAULT_DEV_BRAND is not used as a production hostname fallback.",
      ),
    );
  }

  const assets = classifyBrandAssets(input.brand, publicDir);
  const missingRequired = assets.filter((asset) => asset.kind === "required" && !asset.exists);
  if (missingRequired.length) {
    findings.push(
      finding("BLOCKER", "REQUIRED_ASSET", "A required ProductReviews production asset is missing."),
    );
  } else {
    findings.push(finding("PASS", "REQUIRED_ASSET", "Required ProductReviews hero asset is present."));
  }
  const missingOptional = assets.filter((asset) => asset.kind === "optional" && !asset.exists);
  const unconfiguredOptional: string[] = [];
  if (input.brand.kind === "production") {
    if (!input.brand.favicon) unconfiguredOptional.push("favicon");
    if (!input.brand.seo.ogImage) unconfiguredOptional.push("ogImage");
  }
  const optionalNotes = [
    ...missingOptional.map((item) => item.key),
    ...unconfiguredOptional,
  ];
  if (optionalNotes.length) {
    findings.push(
      finding(
        "WARNING",
        "OPTIONAL_ASSET",
        `Optional assets are not yet supplied: ${[...new Set(optionalNotes)].join(", ")}.`,
      ),
    );
  }

  const placeholderPages = [
    input.brand.pages.privacy,
    input.brand.pages.terms,
    input.brand.pages.disclaimer,
  ].filter((page) => page.status !== "final");
  const contactPending =
    input.brand.pages.contact.status !== "final" || !input.brand.pages.contact.email?.trim();
  const ctaPending = input.brand.learning.ctaDestinationStatus !== "final";

  if (placeholderPages.length) {
    findings.push(
      finding(
        requireFinalContent ? "BLOCKER" : "WARNING",
        "LEGAL_CONTENT",
        "Placeholder legal page detected. Final Privacy Policy, Terms, and Disclaimer have not been supplied.",
      ),
    );
  } else {
    findings.push(finding("PASS", "LEGAL_CONTENT", "Legal pages are marked as final client content."));
  }

  if (contactPending) {
    findings.push(
      finding(
        requireFinalContent ? "BLOCKER" : "WARNING",
        "CONTACT_DETAILS",
        "Final contact details are pending. No email address has been invented.",
      ),
    );
  } else {
    findings.push(finding("PASS", "CONTACT_DETAILS", "Contact details are present."));
  }

  if (ctaPending) {
    findings.push(
      finding(
        requireFinalContent ? "BLOCKER" : "WARNING",
        "LEARNING_CTA",
        "Help make Ava smarter destination is pending client confirmation.",
      ),
    );
  } else {
    findings.push(finding("PASS", "LEARNING_CTA", "Learning CTA destination is marked final."));
  }

  const retentionDays = input.retentionDays?.trim() ?? "";
  if (!retentionDays || !input.retentionApproved) {
    findings.push(
      finding(
        "WARNING",
        "RETENTION",
        "Conversation retention policy is unresolved. No duration has been invented, and automatic deletion is not enabled.",
      ),
    );
  } else {
    findings.push(
      finding(
        "PASS",
        "RETENTION",
        "A retention period is recorded as approved. Automatic deletion is still not enabled in this step.",
      ),
    );
  }

  if (input.analyticsEnabled) {
    const gtmOk = isGtmContainerId(input.gtmId);
    const gaOk = isGa4MeasurementId(input.gaMeasurementId);
    if (!gtmOk && !gaOk) {
      findings.push(
        finding(
          "BLOCKER",
          "ANALYTICS_ID",
          "Analytics is enabled but no valid GA4 measurement ID or GTM ID is configured.",
        ),
      );
    } else {
      findings.push(finding("PASS", "ANALYTICS", "Analytics is enabled with a valid GA4 or GTM ID."));
    }
  } else if (input.analyticsRequired) {
    findings.push(
      finding("BLOCKER", "ANALYTICS", "Analytics is required for launch but is currently disabled."),
    );
  } else {
    findings.push(
      finding(
        "WARNING",
        "ANALYTICS",
        "Analytics is disabled by explicit policy. The application works without it. Enable only after Privacy Policy/notice and any required consent are approved.",
      ),
    );
  }

  if (!input.rateLimitEnabled) {
    findings.push(
      finding(
        "WARNING",
        "RATE_LIMIT",
        "RATE_LIMIT_ENABLED is false. Confirm this is deliberate before launch.",
      ),
    );
  } else if (input.rateLimitMax < 1 || input.rateLimitWindowMs < 1000) {
    findings.push(finding("BLOCKER", "RATE_LIMIT", "Rate-limit values are not sane."));
  } else {
    findings.push(
      finding(
        "PASS",
        "RATE_LIMIT",
        "Rate limiting is enabled. Default values are not a final capacity plan.",
      ),
    );
  }

  if (input.aiMaxConcurrent < 1 || input.aiMaxConcurrent > 32 || input.searchMaxConcurrent < 1 || input.searchMaxConcurrent > 32) {
    findings.push(finding("BLOCKER", "CONCURRENCY", "Concurrency limits are out of range."));
  } else {
    findings.push(finding("PASS", "CONCURRENCY", "Concurrency limits are within the allowed range."));
  }

  if (input.trustProxy || input.trustForwardedHost) {
    findings.push(
      finding(
        "WARNING",
        "PROXY_TRUST",
        "TRUST_PROXY or TRUST_FORWARDED_HOST is enabled. Leave both false unless the reverse proxy overwrites forwarded headers.",
      ),
    );
  } else {
    findings.push(finding("PASS", "PROXY_TRUST", "Proxy trust flags are off."));
  }

  const blockers = findings.filter((item) => item.severity === "BLOCKER");
  const warnings = findings.filter((item) => item.severity === "WARNING");
  const passes = findings.filter((item) => item.severity === "PASS");

  const lines = [
    "ProductReviews production readiness",
    "",
    ...blockers.map((item) => `BLOCKER  ${item.code}: ${item.message}`),
    ...warnings.map((item) => `WARNING  ${item.code}: ${item.message}`),
    ...passes.map((item) => `PASS     ${item.code}: ${item.message}`),
    "",
    blockers.length
      ? `Result: not ready (${blockers.length} blocker${blockers.length === 1 ? "" : "s"}).`
      : "Result: technically ready, with warnings listed above.",
  ];

  const output = redactReadinessText(lines.join("\n"), secrets);

  return {
    findings,
    blockers,
    warnings,
    passes,
    ready: blockers.length === 0,
    output,
  };
}
