import {
  parseOriginAllowList,
  productionHttpsOrigins,
  SHARED_BRANDS,
} from "@product-reviews/contracts";
import { env, type Env } from "../../config/env";

function testFixtureOrigins(): string[] {
  const origins: string[] = [];
  for (const brand of SHARED_BRANDS) {
    if (brand.kind !== "test") continue;
    origins.push(`http://${brand.canonicalDomain}`);
    origins.push(`http://${brand.canonicalDomain}:3000`);
  }
  return origins;
}

export function frontendOriginAllowList(config: Env = env): string[] {
  const configured = parseOriginAllowList(
    config.FRONTEND_ORIGINS,
    config.FRONTEND_ORIGIN,
  );
  const merged = new Set([...configured, ...productionHttpsOrigins()]);
  if (config.NODE_ENV !== "production") {
    for (const origin of testFixtureOrigins()) merged.add(origin);
  }
  return [...merged];
}

export function isAllowedFrontendOrigin(
  origin: string | undefined,
  config: Env = env,
): boolean {
  if (!origin) return false;
  const normalized = origin.trim().replace(/\/$/, "");
  return frontendOriginAllowList(config).includes(normalized);
}
