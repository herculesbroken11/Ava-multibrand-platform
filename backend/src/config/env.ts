import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

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

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().min(1).default("127.0.0.1"),
    FRONTEND_ORIGIN: z.string().url().default("http://localhost:3000"),
    BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(32_768),
    REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
    AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().min(1).default("gpt-4o-mini"),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(25_000),
    AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().max(4096).default(1200),
    SEARCH_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
    SEARCH_MODEL: z.string().default(""),
    SEARCH_TIMEOUT_MS: z.coerce.number().int().min(3_000).max(12_000).default(10_000),
    SEARCH_MAX_RESULTS: z.coerce.number().int().min(1).max(8).default(5),
    SEARCH_CONTEXT_SIZE: z.enum(["low", "medium", "high"]).default("medium"),
    DATABASE_ENABLED: z.preprocess((value) => {
      if (value === undefined || value === "") return false;
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true" || normalized === "1") return true;
        if (normalized === "false" || normalized === "0") return false;
      }
      return value;
    }, z.boolean()),
    DATABASE_URL: z.string().default(""),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
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
