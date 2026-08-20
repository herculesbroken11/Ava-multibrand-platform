import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { isBrandId } from "@product-reviews/contracts";

function loadDotEnv(filename: string): void {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(".env");
loadDotEnv(".env.local");

function booleanEnv(defaultValue = false) {
  return z.preprocess((value) => {
    if (value === undefined || value === "") return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") return true;
      if (normalized === "false" || normalized === "0") return false;
    }
    return value;
  }, z.boolean());
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().min(1).default("127.0.0.1"),
    FRONTEND_ORIGIN: z.string().url().default("http://localhost:3000"),
    FRONTEND_ORIGINS: z.string().default(""),
    BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(32_768),
    REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
    TRUST_PROXY: booleanEnv(false),
    TRUST_FORWARDED_HOST: booleanEnv(false),
    DEFAULT_DEV_BRAND: z.string().min(1).default("productreviews"),
    AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().min(1).default("gpt-4o-mini"),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(25_000),
    AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().max(4096).default(1200),
    AI_MAX_CONCURRENT_REQUESTS: z.coerce.number().int().min(1).max(32).default(4),
    SEARCH_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
    SEARCH_MODEL: z.string().default(""),
    SEARCH_TIMEOUT_MS: z.coerce.number().int().min(3_000).max(12_000).default(10_000),
    SEARCH_MAX_RESULTS: z.coerce.number().int().min(1).max(8).default(5),
    SEARCH_CONTEXT_SIZE: z.enum(["low", "medium", "high"]).default("medium"),
    SEARCH_MAX_CONCURRENT_REQUESTS: z.coerce.number().int().min(1).max(32).default(4),
    DATABASE_ENABLED: booleanEnv(false),
    DATABASE_URL: z.string().default(""),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
    RATE_LIMIT_ENABLED: booleanEnv(true),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1_000).default(30),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(60_000),
    CONVERSATION_RETENTION_DAYS: z.string().default(""),
    CONVERSATION_RETENTION_APPROVED: booleanEnv(false),
  })
  .superRefine((value, ctx) => {
    if (value.AI_PROVIDER !== "mock" && !value.AI_API_KEY?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AI_API_KEY"],
        message: "AI_API_KEY is required when AI_PROVIDER is not mock",
      });
    }

    if (value.SEARCH_PROVIDER === "openai" && !value.AI_API_KEY?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AI_API_KEY"],
        message: "AI_API_KEY is required when SEARCH_PROVIDER is openai",
      });
    }

    const chain = value.SEARCH_TIMEOUT_MS + value.AI_TIMEOUT_MS + 5_000;
    if (chain > value.REQUEST_TIMEOUT_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["REQUEST_TIMEOUT_MS"],
        message:
          "REQUEST_TIMEOUT_MS must exceed SEARCH_TIMEOUT_MS + AI_TIMEOUT_MS + 5000ms overhead",
      });
    }

    if (value.DEFAULT_DEV_BRAND && !isBrandId(value.DEFAULT_DEV_BRAND)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DEFAULT_DEV_BRAND"],
        message: "DEFAULT_DEV_BRAND must be a registered brand id",
      });
    }

    const retention = value.CONVERSATION_RETENTION_DAYS.trim();
    if (retention) {
      if (!/^\d+$/.test(retention) || Number(retention) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CONVERSATION_RETENTION_DAYS"],
          message: "CONVERSATION_RETENTION_DAYS must be a positive integer when set",
        });
      }
    } else if (value.CONVERSATION_RETENTION_APPROVED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CONVERSATION_RETENTION_DAYS"],
        message: "CONVERSATION_RETENTION_DAYS is required when CONVERSATION_RETENTION_APPROVED is true",
      });
    }

    if (value.DATABASE_ENABLED) {
      const url = value.DATABASE_URL.trim();
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "DATABASE_URL is required when DATABASE_ENABLED is true",
        });
      } else if (!/^postgres(ql)?:\/\//i.test(url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "DATABASE_URL must be a postgres:// or postgresql:// connection string",
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(details)}`);
  }

  return parsed.data;
}

export const env = loadEnv();
