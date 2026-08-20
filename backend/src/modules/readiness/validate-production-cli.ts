import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "../../config/env";
import { productReviewsBrand } from "../../../../frontend/src/brands/productreviews";
import { evaluateProductionReadiness } from "./production-readiness";

function readEnvFile(relativePath: string): Record<string, string> {
  const filePath = resolve(process.cwd(), relativePath);
  if (!existsSync(filePath)) return {};
  const values: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key) values[key] = value;
  }
  return values;
}

function value(...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    if (candidate?.trim()) return candidate.trim();
  }
  return "";
}

function asBoolean(raw: string, fallback: boolean): boolean {
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return fallback;
}

const backendProduction = readEnvFile(".env.production");
const frontendProduction = readEnvFile("../frontend/.env.production");
const frontendLocal = readEnvFile("../frontend/.env");

const report = evaluateProductionReadiness({
  nodeEnv: value(process.env.NODE_ENV, backendProduction.NODE_ENV, env.NODE_ENV),
  aiProvider: value(process.env.AI_PROVIDER, backendProduction.AI_PROVIDER, env.AI_PROVIDER),
  aiApiKey: value(process.env.AI_API_KEY, backendProduction.AI_API_KEY, env.AI_API_KEY),
  aiModel: value(process.env.AI_MODEL, backendProduction.AI_MODEL, env.AI_MODEL),
  searchProvider: value(
    process.env.SEARCH_PROVIDER,
    backendProduction.SEARCH_PROVIDER,
    env.SEARCH_PROVIDER,
  ),
  databaseEnabled: asBoolean(
    value(process.env.DATABASE_ENABLED, backendProduction.DATABASE_ENABLED),
    env.DATABASE_ENABLED,
  ),
  databaseUrl: value(process.env.DATABASE_URL, backendProduction.DATABASE_URL, env.DATABASE_URL),
  databasePoolMax: Number(
    value(
      process.env.DATABASE_POOL_MAX,
      backendProduction.DATABASE_POOL_MAX,
      String(env.DATABASE_POOL_MAX),
    ),
  ),
  frontendOrigin: value(
    process.env.FRONTEND_ORIGIN,
    backendProduction.FRONTEND_ORIGIN,
    env.FRONTEND_ORIGIN,
  ),
  frontendOrigins: value(
    process.env.FRONTEND_ORIGINS,
    backendProduction.FRONTEND_ORIGINS,
    env.FRONTEND_ORIGINS,
  ),
  apiBaseUrl: value(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    frontendProduction.NEXT_PUBLIC_API_BASE_URL,
    frontendLocal.NEXT_PUBLIC_API_BASE_URL,
  ),
  analyticsEnabled: asBoolean(
    value(
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
      frontendProduction.NEXT_PUBLIC_ANALYTICS_ENABLED,
      frontendLocal.NEXT_PUBLIC_ANALYTICS_ENABLED,
    ),
    false,
  ),
  gaMeasurementId: value(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    frontendProduction.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    frontendLocal.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  ),
  gtmId: value(
    process.env.NEXT_PUBLIC_GTM_ID,
    frontendProduction.NEXT_PUBLIC_GTM_ID,
    frontendLocal.NEXT_PUBLIC_GTM_ID,
  ),
  analyticsRequired: false,
  requireFinalContent: true,
  rateLimitEnabled: asBoolean(
    value(process.env.RATE_LIMIT_ENABLED, backendProduction.RATE_LIMIT_ENABLED),
    env.RATE_LIMIT_ENABLED,
  ),
  rateLimitMax: Number(
    value(process.env.RATE_LIMIT_MAX, backendProduction.RATE_LIMIT_MAX, String(env.RATE_LIMIT_MAX)),
  ),
  rateLimitWindowMs: Number(
    value(
      process.env.RATE_LIMIT_WINDOW_MS,
      backendProduction.RATE_LIMIT_WINDOW_MS,
      String(env.RATE_LIMIT_WINDOW_MS),
    ),
  ),
  aiMaxConcurrent: Number(
    value(
      process.env.AI_MAX_CONCURRENT_REQUESTS,
      backendProduction.AI_MAX_CONCURRENT_REQUESTS,
      String(env.AI_MAX_CONCURRENT_REQUESTS),
    ),
  ),
  searchMaxConcurrent: Number(
    value(
      process.env.SEARCH_MAX_CONCURRENT_REQUESTS,
      backendProduction.SEARCH_MAX_CONCURRENT_REQUESTS,
      String(env.SEARCH_MAX_CONCURRENT_REQUESTS),
    ),
  ),
  trustProxy: asBoolean(
    value(process.env.TRUST_PROXY, backendProduction.TRUST_PROXY),
    env.TRUST_PROXY,
  ),
  trustForwardedHost: asBoolean(
    value(process.env.TRUST_FORWARDED_HOST, backendProduction.TRUST_FORWARDED_HOST),
    env.TRUST_FORWARDED_HOST,
  ),
  defaultDevBrand: value(
    process.env.DEFAULT_DEV_BRAND,
    backendProduction.DEFAULT_DEV_BRAND,
    env.DEFAULT_DEV_BRAND,
  ),
  retentionDays: value(
    process.env.CONVERSATION_RETENTION_DAYS,
    backendProduction.CONVERSATION_RETENTION_DAYS,
    env.CONVERSATION_RETENTION_DAYS,
  ),
  retentionApproved: asBoolean(
    value(process.env.CONVERSATION_RETENTION_APPROVED, backendProduction.CONVERSATION_RETENTION_APPROVED),
    env.CONVERSATION_RETENTION_APPROVED,
  ),
  brand: productReviewsBrand,
});

console.log("Launch policy: final legal, contact, and CTA content are required (blockers).");
console.log("Secrets are redacted. This command does not call OpenAI or search.");
console.log("");
console.log(report.output);

if (!report.ready) {
  process.exit(1);
}
